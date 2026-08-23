# EXPLAIN Notes (WEEK 8/9)

## #52 — Baseline Query

I ran EXPLAIN on a property search filtering by city, price range, and minimum bedrooms:

```sql
EXPLAIN SELECT * FROM rets_property
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Dallas'))
  AND L_SystemPrice >= 200000
  AND L_SystemPrice <= 600000
  AND L_Keyword2 >= 3;
```

**Result:**

| id | select_type | table | type | possible_keys | key | key_len | rows | filtered | Extra |
|---|---|---|---|---|---|---|---|---|---|
| 1 | SIMPLE | rets_property | range | idx_system_price, idx_beds | idx_system_price | 5 | 17939 | 50.00 | Using index condition; Using where; Using MRR |

**Column meanings:**
- `type: range` — MySQL is doing a range scan on an index, not a full table scan.
- `possible_keys` — MySQL considered both the price index and beds index as candidates.
- `key: idx_system_price` — it picked the price index; MySQL can only use one index per table access in a single scan, so the beds condition (`L_Keyword2 >= 3`) is checked row-by-row instead of via an index.
- `key_len: 5` — bytes of the index actually used; confirms only the price column, not a composite.
- `rows: 17939` — estimated rows MySQL has to examine.
- `filtered: 50%` — of those rows, ~50% are estimated to survive the remaining conditions.
- `Extra` — `Using index condition` = filtering pushed down to the index; `Using where` = additional filtering happens after the index lookup (this is the beds check); `Using MRR` = Multi-Range Read optimization batching row lookups.

**Key finding:** the city condition uses `LOWER(TRIM(L_City))`, which wraps the column in a function. MySQL's B-Tree index on `L_City` stores raw values, so it can't be used against a transformed value — the city filter isn't using any index at all here, even though `idx_city_price (L_City, L_SystemPrice)` already existed.

## #53 — Adding Indexes

I checked existing indexes first and added only what was missing:

**Added:**
- `idx_property_beds_baths` → `(L_Keyword2, LM_Dec_3)`
- `idx_openhouse_listing_date` → `(L_ListingID, OpenHouseDate)` (on `rets_openhouse`, for the property-detail open house lookup)

**Already existed:**
- `idx_city_price` → `(L_City, L_SystemPrice)`
- `idx_L_Zip`, `idx_OpenHouseDate`

Re-running the same EXPLAIN query produced **no change**:

| id | select_type | table | type | possible_keys | key | key_len | rows | filtered | Extra |
|---|---|---|---|---|---|---|---|---|---|
| 1 | SIMPLE | rets_property | range | idx_system_price, idx_beds, idx_property_beds_baths | idx_system_price | 5 | 17939 | 50.00 | Using index condition; Using where; Using MRR |

**Why nothing changed:**
- `idx_property_beds_baths` wasn't chosen because this query only filters `L_Keyword2 >= 3` — it doesn't use `LM_Dec_3` (baths) at all, so the composite index doesn't offer an advantage here. MySQL still preferred the price index as more selective.
- `idx_openhouse_listing_date` doesn't apply to this query since it's on a different table (`rets_openhouse`) not touched here.
- Neither new index addressed the actual bottleneck identified in #52: the city filter still couldn't use any index because of the `LOWER(TRIM())` wrapping.

## Resolving the City Filter

The real fix was to stop transforming the column at query time. I added a generated column that stores the normalized value directly, so it can be indexed:

```sql
-- Cleaned up invalid zero-date values blocking the ALTER (unrelated legacy data issue)
UPDATE rets_property
SET active_check = NULL
WHERE active_check = '0000-00-00 00:00:00';

ALTER TABLE rets_property
MODIFY active_check TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE rets_property
  ADD COLUMN city_normalized VARCHAR(50)
  GENERATED ALWAYS AS (LOWER(TRIM(L_City))) STORED;

CREATE INDEX idx_city_normalized_price
  ON rets_property (city_normalized, L_SystemPrice);
```

Re-running EXPLAIN with the query rewritten to use the new column:

```sql
EXPLAIN SELECT * FROM rets_property
WHERE city_normalized = LOWER(TRIM('Beverly Hills'))
  AND L_SystemPrice >= 200000
  AND L_SystemPrice <= 600000
  AND L_Keyword2 >= 3;
```

**Result:**

| id | select_type | table | type | possible_keys | key | key_len | rows | filtered | Extra |
|---|---|---|---|---|---|---|---|---|---|
| 1 | SIMPLE | rets_property | range | idx_system_price, idx_beds, idx_property_beds_baths, idx_city_normalized_price | **idx_city_normalized_price** | 208 | **1** | 50.00 | Using index condition; Using where |

**Improvement:**
- `key` changed from `idx_system_price` to `idx_city_normalized_price` — MySQL now filters by city first instead of price.
- `rows` dropped from **17,939 to 1** — because city has much higher selectivity (cardinality ~900-997 distinct values) than price, filtering by city first eliminates almost the entire table before the price/beds conditions are even checked.
- `Using MRR` disappeared from `Extra` — MRR batching was only needed when scanning a large range of rows; with only 1 row matched, it's no longer relevant.

**Next step (not yet done):** update `buildFilters()` in `properties.js` to query `city_normalized` instead of `LOWER(TRIM(L_City))`, so the application's actual query matches what's documented here.