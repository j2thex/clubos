-- Rename amenity tables/columns/indexes to "offer"
ALTER TABLE amenity_catalog RENAME TO offer_catalog;
ALTER TABLE club_amenities RENAME TO club_offers;
ALTER TABLE amenity_orders RENAME TO offer_orders;

ALTER TABLE club_offers RENAME COLUMN amenity_id TO offer_id;
ALTER TABLE offer_orders RENAME COLUMN club_amenity_id TO club_offer_id;

ALTER INDEX idx_amenity_catalog_subtype RENAME TO idx_offer_catalog_subtype;
ALTER INDEX idx_club_amenities_club RENAME TO idx_club_offers_club;
ALTER INDEX idx_amenity_orders_club_amenity RENAME TO idx_offer_orders_club_offer;
ALTER INDEX idx_amenity_orders_member RENAME TO idx_offer_orders_member;
