const express = require("express");
const pool = require("../config/db");

const router = express.Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

function buildFilters(query) {
  const conditions = [];
  const values = [];

  const city = parseNonEmptyString(query.city, "city");
  const zipcode = parseNonEmptyString(query.zipcode, "zipcode");
  const minPrice = parsePositiveInt(query.minPrice, "minPrice", { min: 0 });
  const maxPrice = parsePositiveInt(query.maxPrice, "maxPrice", { min: 0 });
  const beds = parsePositiveInt(query.beds, "beds", { min: 0 });
  const baths = parsePositiveInt(query.baths, "baths", { min: 0 });

  if (city) {
    conditions.push("LOWER(TRIM(L_City)) = LOWER(TRIM(?))");
    values.push(city);
  }

  if (zipcode) {
    conditions.push("L_Zip = ?");
    values.push(zipcode);
  }

  if (minPrice !== undefined) {
    conditions.push("L_SystemPrice >= ?");
    values.push(minPrice);
  }

  if (maxPrice !== undefined) {
    conditions.push("L_SystemPrice <= ?");
    values.push(maxPrice);
  }

  if (beds !== undefined) {
    conditions.push("L_Keyword2 >= ?");
    values.push(beds);
  }

  if (baths !== undefined) {
    conditions.push("LM_Dec_3 >= ?");
    values.push(baths);
  }

  return { conditions, values };
}

// GET /api/properties
router.get("/", async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit ?? String(DEFAULT_LIMIT), "limit", {
      min: 1,
      max: MAX_LIMIT,
    });
    const offset = parsePositiveInt(req.query.offset ?? "0", "offset", { min: 0 });

    const { conditions, values } = buildFilters(req.query);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*) AS total
      FROM rets_property
      ${whereClause}
    `;

    const dataSql = `
      SELECT *
      FROM rets_property
      ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const [[{ total }]] = await pool.query(countSql, values);
    const [results] = await pool.query(dataSql, [...values, limit, offset]);

    return res.json({
      total,
      limit,
      offset,
      results,
    });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }

    console.error("GET /api/properties failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
