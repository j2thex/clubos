"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { lookupMemberForSell, recordSale, type MemberForSell, type RecentSale } from "./actions";
import { TopupDialog } from "./topup-dialog";
import { QuantityDialog, type QuantityDialogPayload } from "./quantity-dialog";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false, loading: () => <div className="aspect-square w-full rounded-2xl bg-gray-900" /> },
);

export type SellCategory = { id: string; name: string };

export type SellProduct = {
  id: string;
  categoryId: string | null;
  name: string;
  unit: "gram" | "piece";
  unitPrice: number;
  stockOnHand: number;
  imageUrl: string | null;
};

type CartLine = {
  productId: string;
  name: string;
  unit: "gram" | "piece";
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  weightSource: "manual" | "scale";
  scaleRawReading: string | null;
};

type CartState = {
  lines: CartLine[];
  discount: string;
  comment: string;
};

type CartAction =
  | { type: "ADD"; line: CartLine }
  | { type: "INC"; productId: string }
  | { type: "DEC"; productId: string }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_DISCOUNT"; value: string }
  | { type: "SET_COMMENT"; value: string }
  | { type: "RESET" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.lines.find((l) => l.productId === action.line.productId);
      if (existing && existing.unit === "piece") {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.productId === action.line.productId
              ? { ...l, quantity: l.quantity + action.line.quantity }
              : l,
          ),
        };
      }
      // Grams: each tap adds a new line so the scale capture stays distinct
      // per cart entry. Staff can remove a line if they tapped twice by mistake.
      return { ...state, lines: [...state.lines, action.line] };
    }
    case "INC":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.productId === action.productId && l.unit === "piece"
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        ),
      };
    case "DEC":
      return {
        ...state,
        lines: state.lines
          .map((l) =>
            l.productId === action.productId && l.unit === "piece"
              ? { ...l, quantity: Math.max(0, l.quantity - 1) }
              : l,
          )
          .filter((l) => l.quantity > 0),
      };
    case "REMOVE":
      return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };
    case "SET_DISCOUNT":
      return { ...state, discount: action.value };
    case "SET_COMMENT":
      return { ...state, comment: action.value };
    case "RESET":
      return { lines: [], discount: "", comment: "" };
  }
}

type PickerMode = "idle" | "scanning" | "manual";

export function SellClient({
  clubId,
  clubSlug,
  currencyMode,
  canDoTopup,
  categories,
  products,
  initialMember,
}: {
  clubId: string;
  clubSlug: string;
  currencyMode: "saldo" | "cash";
  canDoTopup: boolean;
  categories: SellCategory[];
  products: SellProduct[];
  initialMember: MemberForSell | null;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [memberData, setMemberData] = useState<MemberForSell | null>(initialMember);
  const initialMemberHandledRef = useRef(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>("idle");
  const [manualCode, setManualCode] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cart, dispatchCart] = useReducer(cartReducer, { lines: [], discount: "", comment: "" });
  const [quantityProduct, setQuantityProduct] = useState<SellProduct | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // If we received initialMember from the server, mark it handled so we
  // don't refetch in the effect below.
  useEffect(() => {
    if (initialMember) initialMemberHandledRef.current = true;
  }, [initialMember]);

  function resolveCode(raw: string) {
    startTransition(async () => {
      const r = await lookupMemberForSell(clubId, raw.toUpperCase());
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      setMemberData(r.data);
      setPickerMode("idle");
      setManualCode("");
      dispatchCart({ type: "RESET" });
    });
  }

  function handleAddProduct(p: SellProduct) {
    if (p.unit === "gram" || p.stockOnHand === 0) {
      // Grams always open the dialog so staff can capture from the scale.
      // Out-of-stock buttons are disabled before reaching here.
      setQuantityProduct(p);
      return;
    }
    dispatchCart({
      type: "ADD",
      line: {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        unitPrice: p.unitPrice,
        imageUrl: p.imageUrl,
        quantity: 1,
        weightSource: "manual",
        scaleRawReading: null,
      },
    });
  }

  function handleQuantityDialogAdd(payload: QuantityDialogPayload) {
    if (!quantityProduct) return;
    dispatchCart({
      type: "ADD",
      line: {
        productId: quantityProduct.id,
        name: quantityProduct.name,
        unit: quantityProduct.unit,
        unitPrice: quantityProduct.unitPrice,
        imageUrl: quantityProduct.imageUrl,
        quantity: payload.quantity,
        weightSource: payload.weightSource,
        scaleRawReading: payload.scaleRawReading,
      },
    });
    setQuantityProduct(null);
  }

  // ---------- derived totals ----------
  const subtotal = useMemo(
    () =>
      Math.round(
        cart.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) * 100,
      ) / 100,
    [cart.lines],
  );
  const discountNum = Number(cart.discount);
  const discountValid = cart.discount === "" || (Number.isFinite(discountNum) && discountNum >= 0);
  const discountApplied = discountValid && cart.discount !== "" ? discountNum : 0;
  const discountTooLarge = discountApplied > subtotal && subtotal > 0;
  const total = Math.max(0, Math.round((subtotal - discountApplied) * 100) / 100);
  const balanceAfter = memberData
    ? Math.round((memberData.saldoBalance - total) * 100) / 100
    : null;
  const insufficientSaldo =
    currencyMode === "saldo" && balanceAfter !== null && balanceAfter < 0;

  const visibleProducts = useMemo(
    () => (activeCategoryId ? products.filter((p) => p.categoryId === activeCategoryId) : products),
    [products, activeCategoryId],
  );

  const cartGramsTotal = useMemo(
    () =>
      Math.round(
        cart.lines
          .filter((l) => l.unit === "gram")
          .reduce((sum, l) => sum + l.quantity, 0) * 1000,
      ) / 1000,
    [cart.lines],
  );
  const monthlyLimit = memberData?.monthlyLimitGrams ?? null;
  const monthlyUsed = memberData?.monthlyConsumedGrams ?? 0;
  const overMonthlyLimit =
    monthlyLimit !== null && monthlyUsed + cartGramsTotal > monthlyLimit;

  const canConfirm =
    !isPending &&
    !!memberData &&
    cart.lines.length > 0 &&
    discountValid &&
    !discountTooLarge &&
    !insufficientSaldo &&
    !overMonthlyLimit;

  function handleConfirm() {
    if (!memberData || !canConfirm) return;
    const linesPayload = cart.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      weightSource: l.weightSource,
      scaleRawReading: l.scaleRawReading,
    }));
    startTransition(async () => {
      const r = await recordSale(clubSlug, {
        clubId,
        memberId: memberData.member.id,
        lines: linesPayload,
        discount: discountApplied,
        comment: cart.comment.trim() || null,
        paidWith: currencyMode,
      });
      if ("error" in r) {
        if (r.error === "over_consumption_limit" && memberData.monthlyLimitGrams !== null) {
          const limit = memberData.monthlyLimitGrams;
          const used = memberData.monthlyConsumedGrams;
          const remaining = Math.max(0, limit - used);
          const fmt = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));
          toast.error(
            t("ops.sell.overMonthlyLimit", {
              remaining: fmt(remaining),
              limit: fmt(limit),
            }),
          );
          // Another station may have sold in between — refresh so the chip
          // reflects the current month-to-date.
          lookupMemberForSell(clubId, memberData.member.memberCode).then((lookup) => {
            if ("ok" in lookup) setMemberData(lookup.data);
          });
          return;
        }
        toast.error(r.error);
        return;
      }
      const idShort = r.saleId.slice(-8).toUpperCase();
      if (currencyMode === "saldo") {
        toast.success(
          t("ops.sell.recordedToastSaldo", {
            id: idShort,
            total: r.total.toFixed(2),
            balance: (r.balanceAfter ?? 0).toFixed(2),
          }),
        );
        setMemberData((cur) =>
          cur ? { ...cur, saldoBalance: r.balanceAfter ?? cur.saldoBalance } : cur,
        );
      } else {
        toast.success(
          t("ops.sell.recordedToast", { id: idShort, total: r.total.toFixed(2) }),
        );
      }
      dispatchCart({ type: "RESET" });
      router.refresh();
      // Re-fetch recent sales for the same member without router.refresh
      // racing — local state is the source of truth between renders.
      const refresh = await lookupMemberForSell(clubId, memberData.member.memberCode);
      if ("ok" in refresh) setMemberData(refresh.data);
    });
  }

  function handleTopupSuccess(newBalance: number) {
    setMemberData((cur) => (cur ? { ...cur, saldoBalance: newBalance } : cur));
    setTopupOpen(false);
    router.refresh();
    if (memberData) {
      lookupMemberForSell(clubId, memberData.member.memberCode).then((r) => {
        if ("ok" in r) setMemberData(r.data);
      });
    }
  }

  // ---------- render ----------

  if (!memberData) {
    return (
      <MemberPicker
        pickerMode={pickerMode}
        setPickerMode={setPickerMode}
        manualCode={manualCode}
        setManualCode={setManualCode}
        isPending={isPending}
        resolveCode={resolveCode}
      />
    );
  }

  return (
    <div className="space-y-3">
      <MemberHeaderBar
        member={memberData}
        currencyMode={currencyMode}
        canDoTopup={canDoTopup}
        onChangeMember={() => {
          setMemberData(null);
          dispatchCart({ type: "RESET" });
        }}
        onOpenTopup={() => setTopupOpen(true)}
      />

      {!memberData.member.idVerifiedAt && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {t("ops.sell.unverifiedBanner")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3">
        {/* Left column: categories + products */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              activeId={activeCategoryId}
              onChange={setActiveCategoryId}
            />
          )}
          {products.length === 0 ? (
            <div className="p-6 text-xs text-gray-500 text-center">
              {t("ops.sell.emptyProducts")}
            </div>
          ) : (
            <ProductGrid products={visibleProducts} onAdd={handleAddProduct} />
          )}
        </section>

        {/* Right column: cart */}
        <CartPanel
          cart={cart}
          dispatch={dispatchCart}
          subtotal={subtotal}
          total={total}
          discountTooLarge={discountTooLarge}
          currencyMode={currencyMode}
          memberBalance={memberData.saldoBalance}
          balanceAfter={balanceAfter}
          insufficientSaldo={insufficientSaldo}
          isPending={isPending}
          canConfirm={canConfirm}
          onConfirm={handleConfirm}
          monthlyLimitGrams={monthlyLimit}
          monthlyUsedGrams={monthlyUsed}
          cartGramsTotal={cartGramsTotal}
          overMonthlyLimit={overMonthlyLimit}
        />
      </div>

      <RecentPurchases sales={memberData.recentSales} />

      <QuantityDialog
        open={!!quantityProduct}
        productName={quantityProduct?.name ?? ""}
        unit={quantityProduct?.unit ?? "piece"}
        stockOnHand={quantityProduct?.stockOnHand ?? 0}
        onClose={() => setQuantityProduct(null)}
        onAdd={handleQuantityDialogAdd}
      />

      <TopupDialog
        open={topupOpen}
        clubId={clubId}
        clubSlug={clubSlug}
        memberId={memberData.member.id}
        memberCode={memberData.member.memberCode}
        onClose={() => setTopupOpen(false)}
        onSuccess={handleTopupSuccess}
      />
    </div>
  );
}

// ---------- subcomponents ----------

function MemberHeaderBar({
  member,
  currencyMode,
  canDoTopup,
  onChangeMember,
  onOpenTopup,
}: {
  member: MemberForSell;
  currencyMode: "saldo" | "cash";
  canDoTopup: boolean;
  onChangeMember: () => void;
  onOpenTopup: () => void;
}) {
  const { t } = useLanguage();
  const m = member.member;
  return (
    <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-mono font-semibold text-gray-900 text-sm">{m.memberCode}</p>
        {m.fullName && <p className="text-xs text-gray-500 truncate">{m.fullName}</p>}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {m.age !== null && (
            <span
              className={`text-[10px] rounded-full px-2 py-0.5 ${
                m.age < 21 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t("ops.entry.age", { age: m.age })}
            </span>
          )}
          {m.idVerifiedAt ? (
            <span className="text-[10px] rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-semibold">
              {t("ops.sell.verified")}
            </span>
          ) : (
            <span className="text-[10px] rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
              {t("ops.sell.notVerified")}
            </span>
          )}
        </div>
      </div>
      {currencyMode === "saldo" && (
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            {t("ops.sell.balance")}
          </p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {member.saldoBalance.toFixed(2)} €
          </p>
        </div>
      )}
      {member.monthlyLimitGrams !== null && (
        <MonthlyUsageChip
          used={member.monthlyConsumedGrams}
          limit={member.monthlyLimitGrams}
        />
      )}
      <div className="flex items-center gap-2">
        {currencyMode === "saldo" && canDoTopup && (
          <button
            type="button"
            onClick={onOpenTopup}
            className="text-xs font-semibold rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
          >
            {t("ops.topup.button")}
          </button>
        )}
        <button
          type="button"
          onClick={onChangeMember}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          {t("ops.sell.changeMember")}
        </button>
      </div>
    </div>
  );
}

function MonthlyUsageChip({ used, limit }: { used: number; limit: number }) {
  const { t } = useLanguage();
  const remaining = Math.max(0, limit - used);
  const ratio = limit > 0 ? used / limit : 0;
  const tone =
    ratio >= 1
      ? "bg-red-100 text-red-800"
      : ratio >= 0.8
        ? "bg-amber-100 text-amber-900"
        : "bg-gray-100 text-gray-700";
  const formatGrams = (v: number) =>
    Number.isInteger(v) ? v.toString() : v.toFixed(1);
  return (
    <div className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${tone}`}>
      <span className="block text-[9px] font-normal uppercase tracking-wide opacity-70">
        {t("ops.sell.monthlyUsage")}
      </span>
      <span className="tabular-nums">
        {formatGrams(used)} / {formatGrams(limit)} g
      </span>
      {ratio < 1 && (
        <span className="block text-[9px] font-normal opacity-70">
          {t("ops.sell.monthlyRemaining", { remaining: formatGrams(remaining) })}
        </span>
      )}
    </div>
  );
}

function CategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: SellCategory[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="relative border-b border-gray-100">
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        <CategoryTab label={t("ops.sell.allCategories")} active={activeId === null} onClick={() => onChange(null)} />
        {categories.map((c) => (
          <CategoryTab key={c.id} label={c.name} active={activeId === c.id} onClick={() => onChange(c.id)} />
        ))}
      </div>
      {/* Right-edge fade tells staff there's more if the strip overflows. */}
      <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 transition ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function ProductGrid({
  products,
  onAdd,
}: {
  products: SellProduct[];
  onAdd: (p: SellProduct) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 p-3">
      {products.map((p) => {
        const out = p.stockOnHand <= 0;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => !out && onAdd(p)}
            disabled={out}
            className={`relative rounded-xl border bg-white text-left overflow-hidden transition shadow-sm hover:shadow-md min-h-[88px] ${
              out ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-stretch gap-2 p-2">
              <ProductThumb imageUrl={p.imageUrl} name={p.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
                  {p.name}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 tabular-nums">
                  {p.unitPrice.toFixed(2)}€/{p.unit === "gram" ? "g" : "ea"}
                </p>
                <p className="text-[10px] text-gray-400 tabular-nums">
                  {out
                    ? t("ops.sell.outOfStock")
                    : t(p.unit === "gram" ? "ops.sell.leftG" : "ops.sell.leftEa", {
                        qty: p.stockOnHand.toFixed(p.unit === "gram" ? 1 : 0),
                      })}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Empty-image fallback: deterministic colored circle with the product's
// first 1-2 letters. Beats a blank gray rectangle for scannability.
function ProductThumb({
  imageUrl,
  name,
  size = "lg",
}: {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "sm" ? "w-9 h-9" : "w-12 h-12";
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={`${dim} rounded-lg object-cover bg-gray-100 shrink-0`}
      />
    );
  }
  const initials = name.trim().slice(0, 2).toUpperCase() || "?";
  // Hash the name to a stable color so the same product always gets the
  // same color across sessions.
  const palette = [
    "bg-rose-200 text-rose-900",
    "bg-amber-200 text-amber-900",
    "bg-emerald-200 text-emerald-900",
    "bg-sky-200 text-sky-900",
    "bg-violet-200 text-violet-900",
    "bg-pink-200 text-pink-900",
    "bg-lime-200 text-lime-900",
    "bg-cyan-200 text-cyan-900",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const cls = palette[Math.abs(hash) % palette.length];
  const textSize = size === "sm" ? "text-[11px]" : "text-sm";
  return (
    <div
      className={`${dim} rounded-lg shrink-0 flex items-center justify-center font-bold ${textSize} ${cls}`}
    >
      {initials}
    </div>
  );
}

function CartPanel({
  cart,
  dispatch,
  subtotal,
  total,
  discountTooLarge,
  currencyMode,
  memberBalance,
  balanceAfter,
  insufficientSaldo,
  isPending,
  canConfirm,
  onConfirm,
  monthlyLimitGrams,
  monthlyUsedGrams,
  cartGramsTotal,
  overMonthlyLimit,
}: {
  cart: CartState;
  dispatch: React.Dispatch<CartAction>;
  subtotal: number;
  total: number;
  discountTooLarge: boolean;
  currencyMode: "saldo" | "cash";
  memberBalance: number;
  balanceAfter: number | null;
  insufficientSaldo: boolean;
  isPending: boolean;
  canConfirm: boolean;
  onConfirm: () => void;
  monthlyLimitGrams: number | null;
  monthlyUsedGrams: number;
  cartGramsTotal: number;
  overMonthlyLimit: boolean;
}) {
  const { t } = useLanguage();
  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-3 self-start">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{t("ops.sell.cart")}</p>
        {cart.lines.length > 0 && (
          <span className="text-[10px] uppercase text-gray-400">
            {t("ops.sell.linesCount", { count: cart.lines.length })}
          </span>
        )}
      </div>
      {cart.lines.length === 0 ? (
        <div className="p-6 text-xs text-gray-500 text-center">{t("ops.sell.cartEmpty")}</div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {cart.lines.map((l, idx) => (
            <CartLineRow
              key={`${l.productId}-${idx}`}
              line={l}
              onInc={() => dispatch({ type: "INC", productId: l.productId })}
              onDec={() => dispatch({ type: "DEC", productId: l.productId })}
              onRemove={() => dispatch({ type: "REMOVE", productId: l.productId })}
            />
          ))}
        </div>
      )}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        <SummaryRow label={t("ops.sell.subtotal")} value={`${subtotal.toFixed(2)} €`} />
        <label className="block">
          <span className="text-xs text-gray-700">{t("ops.sell.discount")}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cart.discount}
            onChange={(e) => dispatch({ type: "SET_DISCOUNT", value: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums text-right text-gray-900 placeholder:text-gray-400"
          />
          {discountTooLarge && (
            <p className="text-[11px] text-red-600 mt-1">{t("ops.sell.discountTooLarge")}</p>
          )}
        </label>
        <label className="block">
          <span className="text-xs text-gray-700">{t("ops.sell.comment")}</span>
          <textarea
            value={cart.comment}
            onChange={(e) => dispatch({ type: "SET_COMMENT", value: e.target.value })}
            placeholder={t("ops.sell.commentPlaceholder")}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400"
          />
        </label>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-gray-700">{t("ops.sell.total")}</span>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">{total.toFixed(2)} €</span>
        </div>
        {currencyMode === "saldo" && balanceAfter !== null && cart.lines.length > 0 && (
          <div
            className={`rounded-lg px-3 py-2 text-xs ${
              insufficientSaldo
                ? "bg-red-50 text-red-700 font-semibold"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {insufficientSaldo
              ? `${t("ops.sell.insufficientSaldo")} (${memberBalance.toFixed(2)} €)`
              : `${t("ops.sell.balanceAfter")}: ${balanceAfter.toFixed(2)} €`}
          </div>
        )}
        {monthlyLimitGrams !== null && cartGramsTotal > 0 && (
          <div
            className={`rounded-lg px-3 py-2 text-xs ${
              overMonthlyLimit
                ? "bg-red-50 text-red-700 font-semibold"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {overMonthlyLimit
              ? t("ops.sell.overMonthlyLimit", {
                  remaining: Math.max(0, monthlyLimitGrams - monthlyUsedGrams).toString(),
                  limit: monthlyLimitGrams.toString(),
                })
              : t("ops.sell.monthlyAfter", {
                  after: (monthlyUsedGrams + cartGramsTotal).toString(),
                  limit: monthlyLimitGrams.toString(),
                })}
          </div>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full rounded-lg bg-green-600 text-white text-base font-semibold py-3 hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? t("ops.sell.confirmingSale") : t("ops.sell.confirm")}
        </button>
      </div>
    </section>
  );
}

function CartLineRow({
  line,
  onInc,
  onDec,
  onRemove,
}: {
  line: CartLine;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const lineTotal = Math.round(line.unitPrice * line.quantity * 100) / 100;
  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <ProductThumb imageUrl={line.imageUrl} name={line.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{line.name}</p>
        <p className="text-[11px] text-gray-500 tabular-nums">
          {line.quantity}
          {line.unit === "gram" ? "g" : ""} · {line.unitPrice.toFixed(2)}€/
          {line.unit === "gram" ? "g" : "ea"}
        </p>
      </div>
      {line.unit === "piece" ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDec}
            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
            aria-label="-"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums text-gray-900">{line.quantity}</span>
          <button
            type="button"
            onClick={onInc}
            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
            aria-label="+"
          >
            +
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold text-gray-700 tabular-nums">
          {line.quantity}g
        </span>
      )}
      <span className="text-sm font-semibold text-gray-900 tabular-nums w-16 text-right">
        {lineTotal.toFixed(2)} €
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-300 hover:text-red-500 text-lg leading-none px-1"
        aria-label={t("ops.sell.removeLine")}
        title={t("ops.sell.removeLine")}
      >
        ×
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function RecentPurchases({ sales }: { sales: RecentSale[] }) {
  const { t } = useLanguage();
  if (sales.length === 0) {
    return (
      <section className="bg-white rounded-2xl shadow-lg p-4">
        <p className="text-sm font-semibold text-gray-900">{t("ops.sell.recentPurchases")}</p>
        <p className="text-xs text-gray-500 mt-2">{t("ops.sell.noRecentPurchases")}</p>
      </section>
    );
  }
  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">{t("ops.sell.recentPurchases")}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {sales.map((s) => (
          <div key={s.saleId} className="px-4 py-2 flex items-center gap-3 text-xs">
            <span className="text-gray-400 tabular-nums w-32 shrink-0">
              {new Date(s.createdAt).toLocaleString()}
            </span>
            <span className="flex-1 min-w-0 truncate text-gray-700">
              {t("ops.sell.linesCount", { count: s.lineCount })}
              {s.comment ? ` · ${s.comment}` : ""}
            </span>
            <span
              className={`tabular-nums font-semibold ${s.voidedAt ? "text-gray-400 line-through" : "text-gray-900"}`}
            >
              {s.total.toFixed(2)} €
            </span>
            {s.voidedAt && (
              <span className="text-[10px] rounded-full px-2 py-0.5 bg-red-100 text-red-700">
                {t("ops.sell.voided")}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MemberPicker({
  pickerMode,
  setPickerMode,
  manualCode,
  setManualCode,
  isPending,
  resolveCode,
}: {
  pickerMode: PickerMode;
  setPickerMode: (m: PickerMode) => void;
  manualCode: string;
  setManualCode: (s: string) => void;
  isPending: boolean;
  resolveCode: (code: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">{t("ops.sell.findMember")}</p>
      </div>
      {pickerMode === "scanning" ? (
        <div className="relative">
          <Scanner
            onScan={(results) => {
              const first = results[0]?.rawValue;
              if (first) resolveCode(first);
            }}
            onError={(err) => {
              toast.error(err instanceof Error ? err.message : t("ops.scale.connectFailed"));
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
            {t("ops.sell.cancel")}
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
            placeholder={t("ops.memberForm.codePlaceholder")}
            maxLength={8}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-mono uppercase tracking-wide text-gray-900 placeholder:text-gray-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !manualCode.trim()}
              className="flex-1 rounded-lg bg-gray-800 text-white text-sm font-semibold py-2 disabled:opacity-50"
            >
              {isPending ? "…" : t("ops.sell.find")}
            </button>
            <button
              type="button"
              onClick={() => setPickerMode("idle")}
              className="rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2"
            >
              {t("ops.sell.cancel")}
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
            {t("ops.sell.scanQr")}
          </button>
          <button
            type="button"
            onClick={() => setPickerMode("manual")}
            className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-3"
          >
            {t("ops.sell.enterManually")}
          </button>
        </div>
      )}
    </section>
  );
}
