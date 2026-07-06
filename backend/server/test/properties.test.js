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
    assert.equal(
      property.city.trim().toLowerCase(),
      city.toLowerCase()
    );
  }
});

test("GET /api/properties rejects invalid limit", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties?limit=0`
  );

  assert.equal(response.status, 400);
});

test("GET /api/properties rejects invalid minPrice", async () => {
  const response = await fetch(
    `${baseUrl}/api/properties?minPrice=abc`
  );

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