import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestClient } from "../helpers/test-client";
import { setupClub, setupProduct, cleanupClub } from "../helpers/fixtures";

describe("sell_product RPC", () => {
  const db = getTestClient();
  let clubId: string;
  let staffId: string;
  let memberId: string;
  let productId: string;

  beforeAll(async () => {
    const club = await setupClub(db);
    clubId = club.clubId;
    staffId = club.staffId;
    memberId = club.memberId;

    const product = await setupProduct(db, clubId, {
      stockOnHand: 100,
      unitPrice: 10,
    });
    productId = product.productId;
  });

  afterAll(async () => {
    await cleanupClub(db, clubId);
  });

  it("decrements stock, inserts transaction, writes audit row on success", async () => {
    const { data: txId, error } = await db.rpc("sell_product", {
      p_club_id: clubId,
      p_product_id: productId,
      p_member_id: memberId,
      p_staff_id: staffId,
      p_quantity: 5,
      p_weight_source: "manual",
    });

    expect(error).toBeNull();
    expect(txId).toBeTruthy();

    const { data: product } = await db
      .from("products")
      .select("stock_on_hand")
      .eq("id", productId)
      .single();
    expect(Number(product!.stock_on_hand)).toBe(95);

    const { data: tx } = await db
      .from("product_transactions")
      .select("*")
      .eq("id", txId)
      .single();
    expect(Number(tx!.quantity)).toBe(5);
    expect(Number(tx!.total_price)).toBe(50);
    expect(tx!.member_id).toBe(memberId);
    expect(tx!.fulfilled_by).toBe(staffId);
    expect(tx!.weight_source).toBe("manual");
    expect(tx!.voided_at).toBeNull();

    const { data: audit } = await db
      .from("activity_log")
      .select("*")
      .eq("club_id", clubId)
      .eq("action", "product_sale");
    expect(audit?.length).toBeGreaterThanOrEqual(1);
    expect(audit![0].staff_member_id).toBe(staffId);
  });

  it("rejects insufficient stock without mutating", async () => {
    const before = await db
      .from("products")
      .select("stock_on_hand")
      .eq("id", productId)
      .single();
    const stockBefore = Number(before.data!.stock_on_hand);

    const { error } = await db.rpc("sell_product", {
      p_club_id: clubId,
      p_product_id: productId,
      p_member_id: memberId,
      p_staff_id: staffId,
      p_quantity: 9999,
      p_weight_source: "manual",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/insufficient_stock/);

    const after = await db
      .from("products")
      .select("stock_on_hand")
      .eq("id", productId)
      .single();
    expect(Number(after.data!.stock_on_hand)).toBe(stockBefore);
  });

  it("rejects staff from a different club (defense-in-depth)", async () => {
    const otherClub = await setupClub(db);
    try {
      const { error } = await db.rpc("sell_product", {
        p_club_id: clubId,
        p_product_id: productId,
        p_member_id: memberId,
        p_staff_id: otherClub.staffId,
        p_quantity: 1,
        p_weight_source: "manual",
      });

      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/staff_wrong_club/);
    } finally {
      await cleanupClub(db, otherClub.clubId);
    }
  });

  it("rejects invalid quantity (zero)", async () => {
    const { error } = await db.rpc("sell_product", {
      p_club_id: clubId,
      p_product_id: productId,
      p_member_id: memberId,
      p_staff_id: staffId,
      p_quantity: 0,
      p_weight_source: "manual",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid_quantity/);
  });

  it("rejects invalid weight_source", async () => {
    const { error } = await db.rpc("sell_product", {
      p_club_id: clubId,
      p_product_id: productId,
      p_member_id: memberId,
      p_staff_id: staffId,
      p_quantity: 1,
      p_weight_source: "estimate",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid_weight_source/);
  });
});

describe("void_product_sale RPC", () => {
  const db = getTestClient();
  let clubId: string;
  let staffId: string;
  let memberId: string;
  let productId: string;

  beforeAll(async () => {
    const club = await setupClub(db);
    clubId = club.clubId;
    staffId = club.staffId;
    memberId = club.memberId;

    const product = await setupProduct(db, clubId, {
      stockOnHand: 50,
      unitPrice: 5,
    });
    productId = product.productId;
  });

  afterAll(async () => {
    await cleanupClub(db, clubId);
  });

  async function makeSale(quantity: number) {
    const { data: txId, error } = await db.rpc("sell_product", {
      p_club_id: clubId,
      p_product_id: productId,
      p_member_id: memberId,
      p_staff_id: staffId,
      p_quantity: quantity,
      p_weight_source: "manual",
    });
    if (error) throw new Error(error.message);
    return txId as string;
  }

  it("restores stock atomically and stamps void fields", async () => {
    const txId = await makeSale(3);

    const before = await db
      .from("products")
      .select("stock_on_hand")
      .eq("id", productId)
      .single();
    const stockAfterSale = Number(before.data!.stock_on_hand);

    const { error: voidErr } = await db.rpc("void_product_sale", {
      p_transaction_id: txId,
      p_club_id: clubId,
      p_staff_id: staffId,
      p_reason: "wrong product",
    });
    expect(voidErr).toBeNull();

    const after = await db
      .from("products")
      .select("stock_on_hand")
      .eq("id", productId)
      .single();
    expect(Number(after.data!.stock_on_hand)).toBe(stockAfterSale + 3);

    const { data: tx } = await db
      .from("product_transactions")
      .select("voided_at, voided_by, void_reason")
      .eq("id", txId)
      .single();
    expect(tx!.voided_at).not.toBeNull();
    expect(tx!.voided_by).toBe(staffId);
    expect(tx!.void_reason).toBe("wrong product");
  });

  it("rejects empty reason", async () => {
    const txId = await makeSale(1);
    const { error } = await db.rpc("void_product_sale", {
      p_transaction_id: txId,
      p_club_id: clubId,
      p_staff_id: staffId,
      p_reason: "  ",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/reason_required/);
  });

  it("rejects double-void", async () => {
    const txId = await makeSale(1);
    await db.rpc("void_product_sale", {
      p_transaction_id: txId,
      p_club_id: clubId,
      p_staff_id: staffId,
      p_reason: "first",
    });

    const { error } = await db.rpc("void_product_sale", {
      p_transaction_id: txId,
      p_club_id: clubId,
      p_staff_id: staffId,
      p_reason: "second",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/already_voided/);
  });

  it("rejects cross-club void", async () => {
    const txId = await makeSale(1);
    const otherClub = await setupClub(db);
    try {
      const { error } = await db.rpc("void_product_sale", {
        p_transaction_id: txId,
        p_club_id: otherClub.clubId,
        p_staff_id: otherClub.staffId,
        p_reason: "trying to reach across clubs",
      });
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/cross_club/);
    } finally {
      await cleanupClub(db, otherClub.clubId);
    }
  });
});
