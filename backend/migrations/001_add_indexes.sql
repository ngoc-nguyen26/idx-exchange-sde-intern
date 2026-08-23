-- Add indexes for filter query performance (Week 8/9)
-- normalizes L_City into a generated column so it can be indexed
-- (LOWER(TRIM()) on the raw column prevents index usage in MySQL).

SET SESSION sql_mode = (SELECT REPLACE(@@sql_mode, 'NO_ZERO_DATE', ''));
SET SESSION sql_mode = (SELECT REPLACE(@@sql_mode, 'STRICT_TRANS_TABLES', ''));

UPDATE rets_property
SET active_check = NULL
WHERE active_check = '0000-00-00 00:00:00';

ALTER TABLE rets_property
  MODIFY active_check TIMESTAMP NULL DEFAULT NULL;


CREATE INDEX idx_property_beds_baths
  ON rets_property (L_Keyword2, LM_Dec_3);


ALTER TABLE rets_property
  ADD COLUMN city_normalized VARCHAR(50)
  GENERATED ALWAYS AS (LOWER(TRIM(L_City))) STORED;

CREATE INDEX idx_city_normalized_price
  ON rets_property (city_normalized, L_SystemPrice);


CREATE INDEX idx_openhouse_listing_date
  ON rets_openhouse (L_ListingID, OpenHouseDate);