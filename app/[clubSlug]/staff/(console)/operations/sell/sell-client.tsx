"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { lookupMemberForEntry, type LookedUpMember } from "../entry/actions";
import { sellProduct } from "./actions";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false, loading: () => <div className="aspect-square w-full rounded-2xl bg-gray-900" /> },
);

export type SellProduct = {
  id: string;
  name: string;
  nameEs: string | null;
  categoryName: string | null;
  unit: "gram" | "piece";
  unitPrice: number;
  stockOnHand: number;
  imageUrl: string | null;
};

type PickerMode = "idle" | "scanning" | "manual";

export function SellClient({
  clubId,
  clubSlug,
  products,
}: {
  clubId: string;
  clubSlug: string;
  products: SellProduct[];
}) {
  const [pickerMode, setPickerMode] = useState<PickerMode>("idle");
  const [manualCode, setManualCode] = useState("");
  const [member, setMember] = useState<LookedUpMember | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const product = products.find((p) => p.id === productId) ?? null;
  const qty = Number(quantity);
  const qtyValid = Number.isFinite(qty) && qty > 0;
  const inStock = product ? product.stockOnHand >= qty : true;
  const total =
    product && qtyValid ? Math.round(product.unitPrice * qty * 100) / 100 : 0;

  function resolveCode(raw: string) {
    startTransition(async () => {
      const r = await lookupMemberForEntry(clubId, raw);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      if (!r.member.idVerifiedAt) {
        toast.warning("Member is not ID-verified. Proceed carefully.");
      }
      setMember(r.member);
      setPickerMode("idle");
      setManualCode("");
    });
  }

  function handleConfirm() {
    if (!member || !product) return;
    startTransition(async () => {
      const r = await sellProduct(clubSlug, {
        clubId,
        productId: product.id,
        memberId: member.id,
        quantity: qty,
        weightSource: "manual",
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`Sale recorded: ${total.toFixed(2)} €`);
      setMember(null);
      setProductId("");
      setQuantity("");
    });
  }

  return (
    <div className="space-y-4">
      {/* Step 1 — member */}
      <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">1. Member</p>
          {member && (
            <button
              type="button"
              onClick={() => setMember(null)}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              Change
            </button>
          )}
        </div>
        {member ? (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono font-semibold text-gray-900 text-sm">
                {member.memberCode}
              </p>
              {member.fullName && (
                <p className="text-xs text-gray-500 truncate">{member.fullName}</p>
              )}
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {member.age !== null && (
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      member.age < 21
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Age {member.age}
                  </span>
                )}
                {member.idVerifiedAt ? (
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-semibold">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                    Not verified
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : pickerMode === "scanning" ? (
          <div className="relative">
            <Scanner
              onScan={(results) => {
                const first = results[0]?.rawValue;
                if (first) resolveCode(first);
              }}
              onError={(err) => {
                toast.error(err instanceof Error ? err.message : "Camera error");
                setPickerMode("idle");
              }}
              constraints={{ facingMode: "environment" }}
              allowMultiple={false}
              scanDelay={400}
              styles={{ container: { aspectRatio: "1 / 1" } }}
            />
            <button
              type="button"
              onClick={() => setPickerMode("idle")}
              className="absolute top-3 right-3 rounded-full bg-black/60 text-white text-xs font-semibold px-3 py-1.5 hover:bg-black/80"
            >
              Cancel
            </button>
          </div>
        ) : pickerMode === "manual" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) resolveCode(manualCode.trim());
            }}
            className="p-4 space-y-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="ABC12"
              maxLength={8}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-mono uppercase tracking-wide"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending || !manualCode.trim()}
                className="flex-1 rounded-lg bg-gray-800 text-white text-sm font-semibold py-2 disabled:opacity-50"
              >
                {isPending ? "…" : "Find"}
              </button>
              <button
                type="button"
                onClick={() => setPickerMode("idle")}
                className="rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-2">
            <button
              type="button"
              onClick={() => setPickerMode("scanning")}
              className="w-full rounded-lg bg-gray-800 text-white text-sm font-semibold py-3"
            >
              Scan QR
            </button>
            <button
              type="button"
              onClick={() => setPickerMode("manual")}
              className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-3"
            >
              Enter code manually
            </button>
          </div>
        )}
      </section>

      {/* Step 2 — product */}
      <section
        className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
          !member ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">2. Product</p>
        </div>
        {products.length === 0 ? (
          <div className="p-4 text-xs text-gray-500">
            No products available. Add them in Admin → Content → Products.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {products.map((p) => {
              const out = p.stockOnHand <= 0;
              const selected = productId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !out && setProductId(p.id)}
                  disabled={out}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                    selected ? "bg-blue-50" : "hover:bg-gray-50"
                  } ${out ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.categoryName ?? "—"} · {p.unitPrice.toFixed(2)}€/
                      {p.unit === "gram" ? "g" : "ea"} ·{" "}
                      {out
                        ? "Out of stock"
                        : `${p.stockOnHand.toFixed(p.unit === "gram" ? 1 : 0)}${p.unit === "gram" ? "g" : ""} left`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 3 — quantity + confirm */}
      <section
        className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
          !product || !member ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">
            3. Quantity {product ? `(${product.unit === "gram" ? "grams" : "pieces"})` : ""}
          </p>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="number"
            step={product?.unit === "piece" ? "1" : "0.1"}
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={product?.unit === "gram" ? "e.g. 3.5" : "e.g. 2"}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-900 text-center"
          />
          {product && qtyValid && (
            <div
              className={`rounded-lg p-3 text-center ${
                inStock ? "bg-gray-50" : "bg-red-50"
              }`}
            >
              {inStock ? (
                <>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {total.toFixed(2)} €
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {qty}
                    {product.unit === "gram" ? "g" : ""} @{" "}
                    {product.unitPrice.toFixed(2)}€/
                    {product.unit === "gram" ? "g" : "ea"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-700 font-semibold">
                  Only {product.stockOnHand.toFixed(product.unit === "gram" ? 1 : 0)}
                  {product.unit === "gram" ? "g" : ""} in stock
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !member || !product || !qtyValid || !inStock}
            className="w-full rounded-lg bg-green-600 text-white text-sm font-semibold py-3 hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Recording…" : "Record sale"}
          </button>
        </div>
      </section>
    </div>
  );
}
