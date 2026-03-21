# Batch 2: Offers Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign offers as tile grids on public + member pages, and improve admin offers UX with collapse/expand accordion and archive functionality.

**Architecture:** Two independent workstreams: (1) tile grid view is a pure UI change on public and member pages, (2) admin UX overhaul adds a DB column, server actions, and refactors the OfferManager component with accordion + archive tab. Query filters for archived offers are added across all consumer pages.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres), Server Actions, Tailwind CSS, lucide-react icons, i18n dictionaries

**Spec:** `docs/superpowers/specs/2026-03-21-batch2-offers-overhaul-design.md`

**Branch:** `feat/batch2-offers-overhaul` (off `develop`)

---

### Task 1: Create feature branch

- [ ] **Step 1: Create branch off develop**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/batch2-offers-overhaul
```

---

### Task 2: Add archived column + i18n keys

**Files:**
- Create: `supabase/migrations/20260321200000_add_offer_archived.sql`
- Modify: `lib/i18n/dictionaries/en.json`
- Modify: `lib/i18n/dictionaries/es.json`

- [ ] **Step 1: Create migration**

Create `supabase/migrations/20260321200000_add_offer_archived.sql`:
```sql
ALTER TABLE club_offers ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
```

- [ ] **Step 2: Add i18n keys to en.json**

Add near other `admin.*` keys:
```json
"admin.editOffer": "Edit",
"admin.archiveOffer": "Archive",
"admin.restoreOffer": "Restore",
"admin.archivedTab": "Archived",
"admin.noArchivedOffers": "No archived offers",
"admin.collapseOffer": "Close",
"offers.public": "Public"
```

- [ ] **Step 3: Add i18n keys to es.json**

Same location:
```json
"admin.editOffer": "Editar",
"admin.archiveOffer": "Archivar",
"admin.restoreOffer": "Restaurar",
"admin.archivedTab": "Archivados",
"admin.noArchivedOffers": "No hay ofertas archivadas",
"admin.collapseOffer": "Cerrar",
"offers.public": "Público"
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260321200000_add_offer_archived.sql lib/i18n/dictionaries/en.json lib/i18n/dictionaries/es.json
git commit -m "feat: add archived column to club_offers + i18n keys (#84)"
```

---

### Task 3: Add archive/restore server actions

**Files:**
- Modify: `app/[clubSlug]/admin/actions.ts`

- [ ] **Step 1: Add archiveOffer and restoreOffer actions**

Add after the existing `updateOfferOptions` function in `app/[clubSlug]/admin/actions.ts`:

```typescript
export async function archiveOffer(
  clubOfferId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("club_offers")
    .update({ archived: true })
    .eq("id", clubOfferId);

  if (error) return { error: "Failed to archive offer" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function restoreOffer(
  clubOfferId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("club_offers")
    .update({ archived: false })
    .eq("id", clubOfferId);

  if (error) return { error: "Failed to restore offer" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add 'app/[clubSlug]/admin/actions.ts'
git commit -m "feat: add archiveOffer and restoreOffer server actions (#84)"
```

---

### Task 4: Add archived filters to member, public, and staff queries

**Files:**
- Modify: `app/[clubSlug]/(member)/offers/page.tsx:24-28`
- Modify: `app/[clubSlug]/public/page.tsx:77-82`
- Modify: `app/[clubSlug]/staff/(console)/offers/page.tsx:27-32`

- [ ] **Step 1: Filter member offers query**

In `app/[clubSlug]/(member)/offers/page.tsx`, add `.eq("archived", false)` to the query on line 27 (after `.eq("club_id", session.club_id)`):

```typescript
  const { data: offers } = await supabase
    .from("club_offers")
    .select("id, offer_id, orderable, price, display_order, description, description_es, image_url, icon, offer_catalog(id, name, name_es, subtype, icon)")
    .eq("club_id", session.club_id)
    .eq("archived", false)
    .order("display_order", { ascending: true });
```

- [ ] **Step 2: Filter public page offers query**

In `app/[clubSlug]/public/page.tsx`, add `.eq("archived", false)` to the club_offers query (~line 80, after `.eq("is_public", true)`):

```typescript
      supabase
        .from("club_offers")
        .select("id, description, description_es, image_url, icon, is_public, offer_catalog(name, name_es, subtype, icon)")
        .eq("club_id", club.id)
        .eq("is_public", true)
        .eq("archived", false)
        .order("created_at", { ascending: true }),
```

- [ ] **Step 3: Filter staff offers query**

In `app/[clubSlug]/staff/(console)/offers/page.tsx`, add `.eq("archived", false)` to the query on line 31 (after `.eq("orderable", true)`):

```typescript
  const { data: offers } = await supabase
    .from("club_offers")
    .select("id, orderable, offer_catalog(id, name, name_es)")
    .eq("club_id", club.id)
    .eq("orderable", true)
    .eq("archived", false)
    .order("display_order", { ascending: true });
```

- [ ] **Step 4: Commit**

```bash
git add 'app/[clubSlug]/(member)/offers/page.tsx' 'app/[clubSlug]/public/page.tsx' 'app/[clubSlug]/staff/(console)/offers/page.tsx'
git commit -m "feat: filter out archived offers from member, public, and staff views (#84)"
```

---

### Task 5: Update admin offers page to pass archived data

**Files:**
- Modify: `app/[clubSlug]/admin/(panel)/offers/page.tsx:33-34,57-67`

- [ ] **Step 1: Add archived to select and mapping**

In `app/[clubSlug]/admin/(panel)/offers/page.tsx`:

Update the select on line 34 to include `archived`:
```typescript
      .select("id, offer_id, orderable, price, description, description_es, image_url, icon, is_public, archived")
```

Add `archived` to the mapping on line 57-67 (add after `is_public`):
```typescript
          archived: ca.archived ?? false,
```

- [ ] **Step 2: Commit**

```bash
git add 'app/[clubSlug]/admin/(panel)/offers/page.tsx'
git commit -m "feat: pass archived field to OfferManager component (#84)"
```

---

### Task 6: Refactor OfferManager with collapse/expand + archive tab

**Files:**
- Modify: `app/[clubSlug]/admin/offer-manager.tsx` (major refactor)

This is the largest task. The component needs:
1. `archived: boolean` added to `ClubOffer` interface
2. `archiveOffer` and `restoreOffer` imported from actions
3. `useLanguage` hook for i18n
4. `expandedOfferId` state for accordion behavior
5. Subtype tabs exclude archived offers; new "Archived" tab added
6. `OfferRow` refactored: collapsed by default with Edit button, expanded shows full form + Archive button
7. Archived tab shows archived offers with Restore button

- [ ] **Step 1: Update interface and imports**

In `app/[clubSlug]/admin/offer-manager.tsx`:

Update the import on line 4:
```typescript
import { toggleOffer, updateOfferOptions, addCustomOffer, archiveOffer, restoreOffer } from "./actions";
```

Add i18n import after line 7:
```typescript
import { useLanguage } from "@/lib/i18n/provider";
```

Add `archived` to `ClubOffer` interface (line 27-37):
```typescript
interface ClubOffer {
  id: string;
  offer_id: string;
  orderable: boolean;
  price: number | null;
  description: string | null;
  description_es: string | null;
  image_url: string | null;
  icon: string | null;
  is_public: boolean;
  archived: boolean;
}
```

- [ ] **Step 2: Update OfferManager component state and tabs**

Add `expandedOfferId` state and `useLanguage` hook inside `OfferManager` function (after line 52):
```typescript
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const { t } = useLanguage();
```

Update the `enabledCount` to exclude archived (replace line 64):
```typescript
  const enabledCount = clubOffers.filter(co => !co.archived).length;
```

Update `filteredCatalog` to exclude archived offers from subtype tabs. Replace the current `filteredCatalog` (line 66) with:
```typescript
  // For the "archived" tab, show all archived offers regardless of subtype
  const isArchivedTab = activeTab === ("archived" as Subtype);
  const filteredCatalog = isArchivedTab
    ? [] // archived tab doesn't use catalog
    : catalog.filter((a) => a.subtype === activeTab);
  const archivedOffers = clubOffers.filter(co => co.archived);
  // For subtype tabs, exclude archived offers from the enabledMap
  const activeEnabledMap = new Map<string, ClubOffer>();
  for (const ca of clubOffers) {
    if (!ca.archived) activeEnabledMap.set(ca.offer_id, ca);
  }
```

Replace `enabledMap` usage throughout with `activeEnabledMap` (in the `filteredCatalog.map` section).

- [ ] **Step 3: Add Archived tab to tab bar**

Replace the subtype tabs section (lines 108-129) with:
```tsx
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit flex-wrap">
            {SUBTYPES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setActiveTab(st);
                  setShowCustomForm(false);
                  setError(null);
                  setExpandedOfferId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === st
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {SUBTYPE_LABELS[st]}
              </button>
            ))}
            {archivedOffers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("archived" as Subtype);
                  setShowCustomForm(false);
                  setError(null);
                  setExpandedOfferId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  isArchivedTab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("admin.archivedTab")} ({archivedOffers.length})
              </button>
            )}
          </div>
        </div>
```

- [ ] **Step 4: Add archived tab content**

After the existing offer list `div` and before the "Add Other" section, add the archived tab view. The full offer list section (lines 131-154) should be wrapped in `{!isArchivedTab && (...)}` and followed by:

```tsx
        {/* Archived offers list */}
        {isArchivedTab && (
          <div className="divide-y divide-gray-100">
            {archivedOffers.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400">
                {t("admin.noArchivedOffers")}
              </div>
            ) : (
              archivedOffers.map((co) => {
                const catalogOffer = catalog.find(c => c.id === co.offer_id);
                return (
                  <div key={co.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {(co.icon || catalogOffer?.icon) ? (
                        <DynamicIcon name={co.icon || catalogOffer!.icon!} className="w-4 h-4 text-gray-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 truncate">{catalogOffer?.name ?? "Custom"}</p>
                      <p className="text-xs text-gray-400">{SUBTYPE_LABELS[catalogOffer?.subtype as Subtype] ?? catalogOffer?.subtype}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await restoreOffer(co.id, clubSlug);
                          if ("error" in result) setError(result.error);
                        });
                      }}
                      className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t("admin.restoreOffer")}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
```

Also hide the "Add Other" section when on archived tab by wrapping it with `{!isArchivedTab && (...)}`.

- [ ] **Step 5: Refactor OfferRow for collapse/expand**

The `OfferRow` component (lines 214-410) needs major changes. Replace it entirely:

- Add `isExpanded` and `onToggleExpand` props and `onArchive` prop
- Collapsed state: show icon + name + badges (orderable, public, price) + Edit button
- Expanded state: show full form (existing fields) + Archive button + Close button
- After save, call `onToggleExpand(null)` to collapse

Update the OfferRow props:
```typescript
function OfferRow({
  offer,
  clubOffer,
  isEnabled,
  isExpanded,
  isPending,
  onToggle,
  onUpdateOptions,
  onToggleExpand,
  onArchive,
  t,
}: {
  offer: CatalogOffer;
  clubOffer: ClubOffer | null;
  isEnabled: boolean;
  isExpanded: boolean;
  isPending: boolean;
  onToggle: (offerId: string, enabled: boolean) => void;
  onUpdateOptions: (clubOfferId: string, formData: FormData) => void;
  onToggleExpand: (offerId: string | null) => void;
  onArchive: (clubOfferId: string) => void;
  t: (key: string) => string;
})
```

For the collapsed state (when `isEnabled && !isExpanded`), render:
```tsx
          {/* Collapsed preview with badges */}
          <div className="flex items-center gap-2 mt-1 ml-11">
            {clubOffer?.orderable && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t("offers.orderable")}</span>
            )}
            {clubOffer?.is_public && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">{t("offers.public")}</span>
            )}
            {clubOffer?.price != null && clubOffer.price > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-600">${Number(clubOffer.price).toFixed(2)}</span>
            )}
            <button
              type="button"
              onClick={() => onToggleExpand(offer.id)}
              className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
            >
              {t("admin.editOffer")}
            </button>
          </div>
```

For the expanded state (when `isEnabled && isExpanded`), keep the existing form fields but add at the bottom (after the Save button):
```tsx
              <div className="flex items-center gap-2">
                {optionsDirty && (
                  <button type="button" disabled={isPending} onClick={handleSave}
                    className="rounded-lg bg-gray-800 text-white px-3 py-1 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">
                    Save
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggleExpand(null)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {t("admin.collapseOffer")}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onArchive(clubOffer!.id)}
                  className="ml-auto rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {t("admin.archiveOffer")}
                </button>
              </div>
```

Update the `handleSave` function to collapse after save:
```typescript
  function handleSave() {
    if (!clubOffer) return;
    const fd = new FormData();
    fd.set("orderable", localOrderable ? "1" : "0");
    fd.set("price", localPrice);
    fd.set("description", localDescription);
    fd.set("description_es", localDescriptionEs);
    fd.set("icon", localIcon ?? "");
    fd.set("is_public", localIsPublic ? "1" : "0");
    if (localImage) fd.set("image", localImage);
    onUpdateOptions(clubOffer.id, fd);
    setLocalImage(null);
    onToggleExpand(null); // collapse after save
  }
```

- [ ] **Step 6: Update OfferRow usage in OfferManager**

In the `filteredCatalog.map` section, update the `<OfferRow>` usage to pass new props:
```tsx
              <OfferRow
                key={offer.id}
                offer={offer}
                clubOffer={activeEnabledMap.get(offer.id) ?? null}
                isEnabled={!!activeEnabledMap.get(offer.id)}
                isExpanded={expandedOfferId === offer.id}
                isPending={isPending}
                onToggle={handleToggle}
                onUpdateOptions={handleUpdateOptions}
                onToggleExpand={(id) => setExpandedOfferId(id === expandedOfferId ? null : id)}
                onArchive={(clubOfferId) => {
                  startTransition(async () => {
                    const result = await archiveOffer(clubOfferId, clubSlug);
                    if ("error" in result) setError(result.error);
                    setExpandedOfferId(null);
                  });
                }}
                t={t}
              />
```

- [ ] **Step 7: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 8: Commit**

```bash
git add 'app/[clubSlug]/admin/offer-manager.tsx'
git commit -m "feat: refactor OfferManager with collapse/expand + archive tab (#84)"
```

---

### Task 7: Tile grid on public page (#82)

**Files:**
- Modify: `app/[clubSlug]/public/page.tsx` (offers section ~lines 331-375)

- [ ] **Step 1: Replace offers list with tile grid**

In `app/[clubSlug]/public/page.tsx`, replace the entire offers section (from `{hasOffers && (` through its closing `)}`) with:

```tsx
        {/* Offers */}
        {hasOffers && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              {localized("Offers", "Ofertas", locale)}
            </h2>
            <div className="space-y-4">
              {Object.entries(offersBySubtype).map(([subtype, items]) => (
                <div key={subtype}>
                  <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider px-1 mb-1.5">
                    {subtype}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((item) => {
                      const displayIcon = item.club_icon || item.icon;
                      return (
                        <div key={item.id} className="bg-white rounded-xl shadow p-3 flex flex-col items-center text-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover mb-1.5"
                            />
                          ) : displayIcon ? (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                              <DynamicIcon name={displayIcon} className="w-5 h-5 text-gray-500" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                              <span className="text-gray-300 text-lg">+</span>
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-900 leading-tight">{localized(item.name, item.name_es, locale)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add 'app/[clubSlug]/public/page.tsx'
git commit -m "feat: replace offers list with tile grid on public page (#82)"
```

---

### Task 8: Tile grid on member page (#82)

**Files:**
- Modify: `app/[clubSlug]/(member)/offers/offer-list-client.tsx`

- [ ] **Step 1: Replace offer list with tile grid**

In `app/[clubSlug]/(member)/offers/offer-list-client.tsx`, replace the group rendering section (the inner `<div className="space-y-2">` containing `groups[subtype].map(...)`, lines 94-157) with a tile grid:

```tsx
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groups[subtype].map((a) => {
              const displayIcon = a.club_icon || a.icon;
              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl shadow p-3 flex flex-col items-center text-center relative ${
                    a.orderable ? "cursor-pointer active:scale-95 transition-transform" : ""
                  }`}
                  onClick={() => {
                    if (!a.orderable || isPending) return;
                    if (a.order) {
                      handleCancel(a.order.id);
                    } else {
                      handleRequest(a.id);
                    }
                  }}
                >
                  {/* Price badge */}
                  {a.orderable && (
                    <div className="absolute top-1.5 right-1.5">
                      {a.price != null && a.price > 0 ? (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">${a.price.toFixed(2)}</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{t("common.free")}</span>
                      )}
                    </div>
                  )}
                  {/* Icon/Image */}
                  {a.image_url ? (
                    <img src={a.image_url} alt="" className="w-10 h-10 rounded-full object-cover mb-1.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5 bg-gray-100 text-gray-400">
                      {displayIcon ? (
                        <DynamicIcon name={displayIcon} className="w-5 h-5" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      )}
                    </div>
                  )}
                  {/* Name */}
                  <span className="text-xs font-medium text-gray-900 leading-tight">
                    {localized(a.name, a.name_es, locale)}
                  </span>
                  {/* Order status */}
                  {a.orderable && a.order && (
                    <span className="mt-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {t("offers.requested")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add 'app/[clubSlug]/(member)/offers/offer-list-client.tsx'
git commit -m "feat: replace offers list with tile grid on member page (#82)"
```

---

### Task 9: Manual verification + push

- [ ] **Step 1: Full build**

```bash
pnpm build
```

- [ ] **Step 2: Start dev server and test**

```bash
pnpm dev
```

Test checklist:
- Public page: offers show as tile grid (2-3 cols)
- Member page: offers show as tile grid with price badges, request/cancel works
- Admin offers: all enabled offers show collapsed by default
- Admin: click Edit → expands to form, click another → accordion
- Admin: save → collapses back
- Admin: archive → offer moves to Archived tab
- Admin: restore → offer returns to subtype tab
- Archived offers don't show on member, public, or staff pages

- [ ] **Step 3: Push branch**

```bash
git push -u origin feat/batch2-offers-overhaul
```
