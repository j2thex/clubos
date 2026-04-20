"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addProductCategory,
  updateProductCategory,
  archiveProductCategory,
  addProduct,
  updateProduct,
  adjustProductStock,
  archiveProduct,
  uploadProductImageAction,
} from "./products-actions";

export type Category = {
  id: string;
  name: string;
  nameEs: string | null;
  archived: boolean;
  displayOrder: number;
};

export type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  nameEs: string | null;
  description: string | null;
  descriptionEs: string | null;
  imageUrl: string | null;
  unit: "gram" | "piece";
  unitPrice: number;
  stockOnHand: number;
  archived: boolean;
  displayOrder: number;
};

export function ProductsManager({
  clubId,
  clubSlug,
  categories,
  products,
}: {
  clubId: string;
  clubSlug: string;
  categories: Category[];
  products: Product[];
}) {
  const [view, setView] = useState<"active" | "archived">("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleCategories = categories.filter((c) =>
    view === "active" ? !c.archived : c.archived,
  );
  const visibleProducts = products.filter((p) =>
    view === "active" ? !p.archived : p.archived,
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("active")}
          className={`text-xs font-semibold rounded-full px-3 py-1 ${
            view === "active" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setView("archived")}
          className={`text-xs font-semibold rounded-full px-3 py-1 ${
            view === "archived" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Archived
          {" "}
          ({products.filter((p) => p.archived).length + categories.filter((c) => c.archived).length})
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          Categories
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
          {visibleCategories.map((c) => (
            <CategoryRow key={c.id} category={c} clubSlug={clubSlug} />
          ))}
          {view === "active" && (
            <CategoryNewForm clubId={clubId} clubSlug={clubSlug} />
          )}
          {visibleCategories.length === 0 && view === "archived" && (
            <div className="p-6 text-center text-gray-400 text-sm">
              No archived categories.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          Products
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
          {visibleProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              categories={categories}
              clubId={clubId}
              clubSlug={clubSlug}
              isExpanded={expandedId === p.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === p.id ? null : p.id)
              }
            />
          ))}
          {view === "active" && (
            <ProductNewForm
              clubId={clubId}
              clubSlug={clubSlug}
              categories={categories.filter((c) => !c.archived)}
            />
          )}
          {visibleProducts.length === 0 && view === "archived" && (
            <div className="p-6 text-center text-gray-400 text-sm">
              No archived products.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ------------------------- Category components -------------------------

function CategoryRow({
  category,
  clubSlug,
}: {
  category: Category;
  clubSlug: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [nameEs, setNameEs] = useState(category.nameEs ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const r = await updateProductCategory(category.id, clubSlug, name, nameEs);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Category updated");
        setEditing(false);
      }
    });
  }

  function handleArchiveToggle() {
    startTransition(async () => {
      const r = await archiveProductCategory(
        category.id,
        clubSlug,
        !category.archived,
      );
      if ("error" in r) toast.error(r.error);
      else toast.success(category.archived ? "Restored" : "Archived");
    });
  }

  if (editing) {
    return (
      <div className="px-5 py-4 space-y-2 bg-gray-50">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (EN)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
        <input
          type="text"
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Nombre (ES)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(category.name);
              setNameEs(category.nameEs ?? "");
            }}
            className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{category.name}</p>
        {category.nameEs && (
          <p className="text-xs text-gray-400">{category.nameEs}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={handleArchiveToggle}
        disabled={isPending}
        className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50"
      >
        {category.archived ? "Restore" : "Archive"}
      </button>
    </div>
  );
}

function CategoryNewForm({
  clubId,
  clubSlug,
}: {
  clubId: string;
  clubSlug: string;
}) {
  const [name, setName] = useState("");
  const [nameEs, setNameEs] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const r = await addProductCategory(clubId, clubSlug, name, nameEs);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Category added");
        setName("");
        setNameEs("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-3 flex gap-2 items-end bg-gray-50">
      <label className="block flex-1">
        <span className="text-[11px] text-gray-500 mb-1 block">Name (EN)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
      </label>
      <label className="block flex-1">
        <span className="text-[11px] text-gray-500 mb-1 block">Nombre (ES, optional)</span>
        <input
          type="text"
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Nombre"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="rounded-lg bg-gray-800 text-white text-xs font-semibold px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}

// -------------------------- Product components --------------------------

function ProductRow({
  product,
  categories,
  clubId,
  clubSlug,
  isExpanded,
  onToggleExpand,
}: {
  product: Product;
  categories: Category[];
  clubId: string;
  clubSlug: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleArchiveToggle() {
    if (
      !product.archived &&
      !window.confirm(`Archive ${product.name}? Can be restored later.`)
    )
      return;
    startTransition(async () => {
      const r = await archiveProduct(product.id, clubSlug, !product.archived);
      if ("error" in r) toast.error(r.error);
      else toast.success(product.archived ? "Restored" : "Archived");
    });
  }

  if (isExpanded) {
    return (
      <ProductEditForm
        product={product}
        categories={categories}
        clubId={clubId}
        clubSlug={clubSlug}
        onDone={onToggleExpand}
        onArchive={handleArchiveToggle}
      />
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt=""
          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {product.name}
        </p>
        <p className="text-xs text-gray-500">
          {category?.name ?? "Uncategorized"} · {product.unitPrice.toFixed(2)}€/
          {product.unit === "gram" ? "g" : "ea"} · stock{" "}
          {product.stockOnHand.toFixed(product.unit === "gram" ? 1 : 0)}
          {product.unit === "gram" ? "g" : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggleExpand}
        disabled={isPending}
        className="text-xs text-blue-600 hover:underline"
      >
        Edit
      </button>
      {product.archived && (
        <button
          type="button"
          onClick={handleArchiveToggle}
          disabled={isPending}
          className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}

function ProductEditForm({
  product,
  categories,
  clubId,
  clubSlug,
  onDone,
  onArchive,
}: {
  product: Product;
  categories: Category[];
  clubId: string;
  clubSlug: string;
  onDone: () => void;
  onArchive: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [nameEs, setNameEs] = useState(product.nameEs ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [descriptionEs, setDescriptionEs] = useState(product.descriptionEs ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [unit, setUnit] = useState<"gram" | "piece">(product.unit);
  const [unitPrice, setUnitPrice] = useState(product.unitPrice);
  const [stockOnHand, setStockOnHand] = useState(product.stockOnHand);
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Quick stock adjust
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("clubId", clubId);
    fd.set("file", file);
    const res = await uploadProductImageAction(fd);
    setUploading(false);
    if ("error" in res) toast.error(res.error);
    else setImageUrl(res.url);
  }

  function handleSave() {
    startTransition(async () => {
      const r = await updateProduct(product.id, clubSlug, {
        categoryId: categoryId || null,
        name,
        nameEs,
        description,
        descriptionEs,
        imageUrl,
        unit,
        unitPrice,
        stockOnHand,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Product saved");
        onDone();
      }
    });
  }

  function handleAdjustStock() {
    const delta = Number(adjustValue);
    if (!Number.isFinite(delta) || delta === 0) return;
    startTransition(async () => {
      const r = await adjustProductStock(product.id, clubSlug, delta, adjustReason || undefined);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(`New stock: ${r.newStock}`);
        setStockOnHand(r.newStock);
        setAdjustValue("");
        setAdjustReason("");
      }
    });
  }

  return (
    <div className="px-5 py-4 space-y-3 bg-gray-50">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Name (EN)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Nombre (ES)</span>
          <input
            type="text"
            value={nameEs}
            onChange={(e) => setNameEs(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[11px] text-gray-500 mb-1 block">Description (EN)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
      </label>
      <label className="block">
        <span className="text-[11px] text-gray-500 mb-1 block">Descripción (ES)</span>
        <textarea
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">No category</option>
          {categories
            .filter((c) => !c.archived)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "gram" | "piece")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="gram">Sold by gram</option>
          <option value="piece">Sold by piece</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-gray-500">
            Unit price (€/{unit === "gram" ? "g" : "ea"})
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500">
            Stock on hand ({unit === "gram" ? "g" : "units"})
          </span>
          <input
            type="number"
            step={unit === "gram" ? "0.1" : "1"}
            min="0"
            value={stockOnHand}
            onChange={(e) => setStockOnHand(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>
      </div>

      <div>
        <span className="text-[11px] text-gray-500 block mb-1">Image</span>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="w-14 h-14 rounded-lg object-cover bg-gray-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-200" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
            className="text-xs"
          />
          {imageUrl && (
            <button
              type="button"
              onClick={() => {
                setImageUrl(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-xs text-gray-500 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
        {uploading && (
          <p className="text-xs text-gray-400 mt-1">Uploading…</p>
        )}
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-2">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          Quick stock adjust
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            step={unit === "gram" ? "0.1" : "1"}
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            placeholder="±g (e.g. -3.5 or +50)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={handleAdjustStock}
            disabled={isPending || !adjustValue}
            className="rounded-lg bg-blue-600 text-white text-xs font-semibold px-4 py-2 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || uploading || !name.trim()}
          className="flex-1 rounded-lg bg-gray-800 text-white text-sm font-semibold py-2 hover:bg-gray-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onArchive}
          disabled={isPending}
          className="rounded-lg border border-red-200 text-sm font-semibold text-red-600 px-4 py-2 hover:bg-red-50"
        >
          {product.archived ? "Restore" : "Archive"}
        </button>
      </div>
    </div>
  );
}

function ProductNewForm({
  clubId,
  clubSlug,
  categories,
}: {
  clubId: string;
  clubSlug: string;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState<"gram" | "piece">("gram");
  const [unitPrice, setUnitPrice] = useState("");
  const [stockOnHand, setStockOnHand] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const r = await addProduct(clubId, clubSlug, {
        categoryId: categoryId || null,
        name,
        unit,
        unitPrice: Number(unitPrice) || 0,
        stockOnHand: Number(stockOnHand) || 0,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Product added");
        setName("");
        setCategoryId("");
        setUnit("gram");
        setUnitPrice("");
        setStockOnHand("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
      >
        + Add product
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 bg-gray-50">
      <label className="block">
        <span className="text-[11px] text-gray-500">Product name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          autoFocus
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-gray-500">Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500">Unit</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "gram" | "piece")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="gram">Sold by gram</option>
            <option value="piece">Sold by piece</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-gray-500">
            Unit price (€/{unit === "gram" ? "g" : "ea"})
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500">
            Stock on hand ({unit === "gram" ? "g" : "units"})
          </span>
          <input
            type="number"
            step={unit === "gram" ? "0.1" : "1"}
            min="0"
            value={stockOnHand}
            onChange={(e) => setStockOnHand(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
