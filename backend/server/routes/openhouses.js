const express = require("express");
const pool = require("../config/db");
const router = express.Router();

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value, name) {
  if (value === undefined || value === "") {
    const err = new Error(`Missing required query param: ${name}`);
    err.status = 400;
    throw err;
  }
  if (!DATE_PATTERN.test(value) || Number.isNaN(new Date(value).getTime())) {
    const err = new Error(`Invalid ${name}: must be YYYY-MM-DD`);
    err.status = 400;
    throw err;
  }
  return value;
}

function parsePositiveInt(value, name, { min = 0, max = Infinity } = {}) {
  if (value === undefined || value === "") {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    const err = new Error(
      `Invalid ${name}: must be an integer between ${min} and ${max}`
    );
    err.status = 400;
    throw err;
  }
  return num;
}

function parseNonEmptyString(value, name) {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    const err = new Error(`Invalid ${name}: cannot be empty`);
    err.status = 400;
    throw err;
  }
  return trimmed;
}

// Same filter shape as /api/properties (city/zipcode/price/beds/baths), so the
// calendar can be scoped to the user's active search context instead of
// pulling every open house in the date range regardless of location.
function buildPropertyFilters(query) {
  const conditions = [];
  const values = [];

  const city = parseNonEmptyString(query.city, "city");
  const zipcode = parseNonEmptyString(query.zipcode, "zipcode");
  const minPrice = parsePositiveInt(query.minPrice, "minPrice", { min: 0 });
  const maxPrice = parsePositiveInt(query.maxPrice, "maxPrice", { min: 0 });
  const beds = parsePositiveInt(query.beds, "beds", { min: 0 });
  const baths = parsePositiveInt(query.baths, "baths", { min: 0 });

  if (city) {
    conditions.push("p.city_normalized = LOWER(TRIM(?))");
    values.push(city);
  }
  if (zipcode) {
    conditions.push("p.L_Zip = ?");
    values.push(zipcode);
  }
  if (minPrice !== undefined) {
    conditions.push("p.L_SystemPrice >= ?");
    values.push(minPrice);
  }
  if (maxPrice !== undefined) {
    conditions.push("p.L_SystemPrice <= ?");
    values.push(maxPrice);
  }
  if (beds !== undefined) {
    conditions.push("p.L_Keyword2 >= ?");
    values.push(beds);
  }
  if (baths !== undefined) {
    conditions.push("p.LM_Dec_3 >= ?");
    values.push(baths);
  }

  return { conditions, values };
}

// GET /api/openhouses?startDate=&endDate=&city=&zipcode=&minPrice=&maxPrice=&beds=&baths=
router.get("/", async (req, res) => {
  try {
    const startDate = parseDate(req.query.startDate, "startDate");
    const endDate = parseDate(req.query.endDate, "endDate");

    if (startDate > endDate) {
      return res.status(400).json({ error: "startDate must be <= endDate" });
    }

    const { conditions, values } = buildPropertyFilters(req.query);
    const whereClause = ["oh.OpenHouseDate BETWEEN ? AND ?", ...conditions].join(
      " AND "
    );

    const [rows] = await pool.query(
      `SELECT
         oh.L_ListingID,
         oh.OpenHouseDate,
         oh.OH_StartTime,
         oh.OH_EndTime,
         oh.all_data,
         p.L_Address,
         p.L_City,
         p.L_State,
         p.L_Zip,
         p.L_SystemPrice,
         p.L_Keyword2,
         p.LM_Dec_3,
         p.LM_Int2_3,
         p.L_Photos
       FROM rets_openhouse oh
       JOIN rets_property p ON p.L_ListingID = oh.L_ListingID
       WHERE ${whereClause}
       ORDER BY oh.OpenHouseDate ASC, oh.OH_StartTime ASC`,
      [startDate, endDate, ...values]
    );

    return res.json(rows);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    console.error("GET /api/openhouses failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;