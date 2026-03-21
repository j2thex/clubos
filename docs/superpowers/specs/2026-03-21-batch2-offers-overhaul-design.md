# Batch 2: Offers Overhaul — Tile View + Admin UX

**Date:** 2026-03-21
**Trello Cards:** #82, #84

## Overview

Two related changes to the offers system: redesign public + member page offers as a tile grid, and improve admin offers UX with collapse/expand and archive functionality.

---

## Task #82: Offers as tile grid (public + member pages)

**Problem:** Offers currently display as a vertical list grouped by subtype. This takes up a lot of vertical space and doesn't showcase the offers visually. Users want a tile/icon grid view.

**Design:**
- Replace the list layout with a responsive tile grid per subtype group: `grid-cols-2 sm:grid-cols-3`
- Each tile: ~1:1 aspect ratio, icon/image centered, name below, compact card (~90px min-width)
- Subtype section headers remain (localized: "Activities"/"Actividades", etc.)
- On **public page**: tiles are display-only, no interaction
- On **member page**: orderable tiles show a small price badge (top-right). Tapping a tile triggers the request/cancel action (existing functionality, just new visual)
- Tiles use `localized(name, name_es, locale)` for names — already supported by data model
- If offer has `image_url`, show image. If offer has `icon`, show lucide icon. Fallback: generic icon.

**Files changed:**
- `app/[clubSlug]/public/page.tsx` — replace offers list section (~lines 331-375) with tile grid
- `app/[clubSlug]/(member)/offers/offer-list-client.tsx` — replace list with tile grid, preserve request/cancel interaction

**Note:** The member page server component (`app/[clubSlug]/(member)/offers/page.tsx`) already queries all data needed for tiles (image_url, icon, club_icon are all passed). No server-side changes needed for #82.

---

## Task #84: Admin offers collapse/expand + archive

### Part A: Collapse/Expand

**Problem:** When admin opens offers, all enabled offers show expanded with all config fields (description, price, icon picker, image upload, bilingual fields). This is overwhelming with many offers enabled.

**Design:**
- **Collapsed state (default):** Compact row showing: icon + name + status badges (orderable, public, price) + "Edit" button
- **Expanded state:** Full config form with all current fields (description EN/ES, orderable, price, is_public, icon picker, image upload, save button)
- Clicking "Edit" expands that offer, collapsing any other currently expanded offer (accordion behavior)
- After saving, the offer collapses back to preview
- The "Add Other" custom offer form remains at the bottom as-is
- Status badges use i18n keys: `offers.orderable` displays existing key "Orderable"/"Ordenable", `offers.public` badge shows "Public"/"Público"

### Part B: Archive

**Problem:** Admin has no way to hide offers they no longer want without fully deleting them. They may want to re-enable them later.

**Design:**
- New `archived boolean DEFAULT false` column on `club_offers` table
- In expanded edit view: "Archive" button (below save, styled as destructive/secondary)
- Archiving sets `archived = true` — offer is hidden from member, public, and staff views
- New **"Archived" tab** alongside existing subtype tabs (Activities, Experiences, Services, Products, **Archived**)
- Archived tab shows archived offers with: icon + name + original subtype label + "Restore" button
- Restoring sets `archived = false`, offer reappears in its original subtype tab
- All listing queries on member, public, and staff pages filter out `archived = true`
- **Existing pending orders are unaffected** — staff can still fulfill orders for archived offers. Archiving only hides from browse/listing views, not order processing.
- Subtype tab counts and listings exclude archived offers (only active offers shown in subtype tabs)

**Toggle vs Archive coexistence:** The existing toggle-off (disable) performs a hard DELETE on `club_offers`, permanently removing all config (price, descriptions, image). Archive is a soft-hide that preserves all config. Both coexist intentionally — toggle-off = "I don't offer this", archive = "I'm pausing this but may bring it back."

**DB change:**
- Migration: `ALTER TABLE club_offers ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;`

**Server actions:**
- `archiveOffer(clubOfferId, clubSlug)` — sets `archived = true`
- `restoreOffer(clubOfferId, clubSlug)` — sets `archived = false`

**TypeScript types:** The `club_offers` type is defined locally as `ClubOffer` interface inside `offer-manager.tsx` (line 27) and `offer-list-client.tsx` (line 9). Add `archived: boolean` to both interfaces. No changes to `lib/types/database.ts` (it doesn't define `club_offers`).

**Files changed:**
- `supabase/migrations/<timestamp>_add_offer_archived.sql` — new column
- `app/[clubSlug]/admin/offer-manager.tsx` — add `archived` to `ClubOffer` interface, collapse/expand UI refactor, archive/restore buttons, archived tab, exclude archived from subtype tab counts/lists
- `app/[clubSlug]/admin/(panel)/offers/page.tsx` — add `archived` to select query and to the mapped props
- `app/[clubSlug]/admin/actions.ts` — add `archiveOffer` and `restoreOffer` actions
- `app/[clubSlug]/(member)/offers/page.tsx` — add `.eq("archived", false)` to query
- `app/[clubSlug]/(member)/offers/offer-list-client.tsx` — add `archived` to `OfferItem` interface (for completeness, though filtered by query)
- `app/[clubSlug]/public/page.tsx` — add `.eq("archived", false)` to club_offers query
- `app/[clubSlug]/staff/(console)/offers/page.tsx` — add `.eq("archived", false)` to listing query
- `lib/i18n/dictionaries/en.json` and `es.json` — new keys

**i18n keys:**
- `admin.editOffer`: "Edit" / "Editar"
- `admin.archiveOffer`: "Archive" / "Archivar"
- `admin.restoreOffer`: "Restore" / "Restaurar"
- `admin.archivedTab`: "Archived" / "Archivados"
- `admin.noArchivedOffers`: "No archived offers" / "No hay ofertas archivadas"
- `admin.collapseOffer`: "Close" / "Cerrar"
- `offers.public`: "Public" / "Público" (new key for collapsed badge)

**Note:** `offers.orderable` already exists in dictionaries as "Orderable"/"Ordenable" — reuse it, do not overwrite.

---

## Testing Plan

### #82 — Tile grid
1. Public page: verify offers display as responsive tile grid (2 cols narrow, 3 cols wider)
2. Member page: verify tile grid with price badges on orderable offers
3. Tap tile on member page: request action still works
4. Test with clubs that have offers with images vs icons vs neither
5. Test in ES: names should be localized
6. Test on narrow viewport (320px): should show 2 columns, not cramped

### #84 — Admin collapse/expand + archive
1. Open admin offers: all enabled offers show collapsed (icon + name + badges)
2. Click "Edit" on one: expands to full form, others stay collapsed
3. Click "Edit" on another: first collapses, second expands (accordion)
4. Edit and save: collapses back to preview with updated info
5. Click "Archive": offer disappears from active tab, appears in Archived tab
6. Archived tab: shows offer with "Restore" button
7. Click "Restore": offer returns to its subtype tab
8. Verify archived offers don't appear on member, public, or staff pages
9. Verify existing pending orders for archived offers can still be fulfilled by staff
10. Verify subtype tab counts exclude archived offers

## Out of Scope

- Drag-to-reorder offers (existing display_order works)
- Offer categories beyond the existing 4 subtypes
- Changes to the staff offers console UI beyond the query filter
- Confirmation dialog for archive (reversible action, no confirmation needed)
