const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../app");
const pool = require("../config/db");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  await pool.end();
});

test("GET /api/properties returns default pagination", async () => {
  const response = await fetch(`${baseUrl}/api/properties`);
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.limit, 20);
  assert.equal(body.offset, 0);
  assert.ok(typeof body.total === "number");
  assert.ok(Array.isArray(body.results));
  assert.ok(body.results.length <= 20);
});

test("GET /api/properties supports pagination", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties?limit=10&offset=20`
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.limit, 10);
  assert.equal(body.offset, 20);
  assert.ok(body.results.length <= 10);
});

test("GET /api/properties filters by city", async () => {
  const city = "Portland";

  const response = await fetch(
    `${baseUrl}/api/properties?city=${encodeURIComponent(city)}`
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  for (const property of body.results) {
    assert.equal(property.city.trim().toLowerCase(), city.toLowerCase());
  }
});

test("GET /api/properties rejects invalid limit", async () => {
  const response = await fetch(`${baseUrl}/api/properties?limit=0`);
  assert.equal(response.status, 400);
});

test("GET /api/properties rejects invalid minPrice", async () => {
  const response = await fetch(`${baseUrl}/api/properties?minPrice=abc`);
  assert.equal(response.status, 400);
});

test("GET /api/properties returns correct total for minPrice and beds", async () => {
  const minPrice = 300000;
  const beds = 3;

  const response = await fetch(
    `${baseUrl}/api/properties?minPrice=${minPrice}&beds=${beds}`
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM rets_property
      WHERE
        L_SystemPrice >= ?
        AND L_Keyword2 >= ?
    `,
    [minPrice, beds]
  );

  assert.equal(body.total, Number(rows[0].total));
});

// Week 4

const VALID_PROPERTY_ID = "1000291026";
const PROPERTY_WITH_OPENHOUSE_ID = "1077426281";
const ORPHAN_OPENHOUSE_ID = "1021795007";
const NONEXISTENT_ID = "999999999";

test("GET /api/properties/:id returns the full property object for a valid ID", async () => {
  const response = await fetch(`${baseUrl}/api/properties/${VALID_PROPERTY_ID}`);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(String(body.L_ListingID), VALID_PROPERTY_ID);
});

test("GET /api/properties/:id returns 404 for an unknown ID", async () => {
  const response = await fetch(`${baseUrl}/api/properties/${NONEXISTENT_ID}`);
  assert.equal(response.status, 404);

  const body = await response.json();
  assert.ok(body.error);
});

test("GET /api/properties/:id returns 400 for a malformed ID", async () => {
  const response = await fetch(`${baseUrl}/api/properties/abc%2Fdef`);
  assert.equal(response.status, 400);
});

test("GET /api/properties/:id returns 400 for an oversized ID", async () => {
  const oversized = "1".repeat(50);
  const response = await fetch(`${baseUrl}/api/properties/${oversized}`);
  assert.equal(response.status, 400);
});

test("GET /api/properties/:id/openhouses returns an array of open house events", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/${PROPERTY_WITH_OPENHOUSE_ID}/openhouses`
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);

  for (const event of body) {
    assert.equal(String(event.L_ListingID), PROPERTY_WITH_OPENHOUSE_ID);
  }
});

test("GET /api/properties/:id/openhouses returns an empty array when property has no events", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/${VALID_PROPERTY_ID}/openhouses`
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.ok(Array.isArray(body));
  assert.equal(body.length, 0);
});

test("GET /api/properties/:id/openhouses orders events by date and start time ascending", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/${PROPERTY_WITH_OPENHOUSE_ID}/openhouses`
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  for (let i = 1; i < body.length; i++) {
    const prevKey = `${body[i - 1].OpenHouseDate}T${body[i - 1].OH_StartTime}`;
    const currKey = `${body[i].OpenHouseDate}T${body[i].OH_StartTime}`;

    assert.ok(prevKey <= currKey);
  }
});

test("GET /api/properties/:id/openhouses returns 404 for an orphan ID not in rets_property", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/${ORPHAN_OPENHOUSE_ID}/openhouses`
  );

  assert.equal(response.status, 404);

  const body = await response.json();
  assert.ok(body.error);
});

test("GET /api/properties/:id/openhouses returns 404 for a nonexistent property", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/${NONEXISTENT_ID}/openhouses`
  );

  assert.equal(response.status, 404);
});

test("GET /api/properties/:id/openhouses returns 400 for a malformed ID", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/abc%2Fdef/openhouses`
  );

  assert.equal(response.status, 400);
});

test("GET /api/properties/:id/openhouses does not crash the server", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties/${ORPHAN_OPENHOUSE_ID}/openhouses`
  );

  assert.ok([400, 404, 500].includes(response.status));

  const followUp = await fetch(`${baseUrl}/api/properties`);
  assert.equal(followUp.status, 200);
});