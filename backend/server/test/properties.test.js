const request = require("supertest");

// Mock the db module before requiring app, since routes/properties.js
// pulls `pool` from here at require-time.
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

const pool = require("../config/db");
const app = require("../app");

beforeEach(() => {
  pool.query.mockReset();
});

describe("GET /api/properties", () => {
  test("returns default pagination shape", async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 2 }]]) // count query
      .mockResolvedValueOnce([[{ L_ListingID: "1" }, { L_ListingID: "2" }]]); // data query

    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 2,
      limit: 20,
      offset: 0,
      results: [{ L_ListingID: "1" }, { L_ListingID: "2" }],
    });
  });

  test("respects custom limit and offset", async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 50 }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/properties?limit=10&offset=20");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(10);
    expect(res.body.offset).toBe(20);

    // Confirm limit/offset were actually passed to the data query params.
    const dataCallParams = pool.query.mock.calls[1][1];
    expect(dataCallParams).toEqual(expect.arrayContaining([10, 20]));
  });

  test("filters by city", async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[{ L_ListingID: "1", city: "Garland" }]]);

    const res = await request(app).get("/api/properties?city=Garland");

    expect(res.status).toBe(200);
    const [countSql, countParams] = pool.query.mock.calls[0];
    expect(countSql).toContain("city_normalized = LOWER(TRIM(?))");
    expect(countParams).toContain("Garland");
  });

  test("filters by zipcode", async () => {
    pool.query.mockResolvedValueOnce([[{ total: 0 }]]).mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/properties?zipcode=75040");

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toContain("75040");
  });

  test("filters by minPrice and maxPrice", async () => {
    pool.query.mockResolvedValueOnce([[{ total: 0 }]]).mockResolvedValueOnce([[]]);

    const res = await request(app).get(
      "/api/properties?minPrice=200000&maxPrice=500000"
    );

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(
      expect.arrayContaining([200000, 500000])
    );
  });

  test("filters by beds and baths", async () => {
    pool.query.mockResolvedValueOnce([[{ total: 0 }]]).mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/properties?beds=3&baths=2");

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(expect.arrayContaining([3, 2]));
  });

  test("rejects limit of 0", async () => {
    const res = await request(app).get("/api/properties?limit=0");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid limit/);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("rejects limit above MAX_LIMIT", async () => {
    const res = await request(app).get("/api/properties?limit=101");
    expect(res.status).toBe(400);
  });

  test("rejects non-numeric minPrice", async () => {
    const res = await request(app).get("/api/properties?minPrice=abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid minPrice/);
  });

  test("rejects empty city string", async () => {
    const res = await request(app).get("/api/properties?city=");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid city/);
  });

  test("returns 500 when the database throws", async () => {
    pool.query.mockRejectedValueOnce(new Error("connection lost"));

    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});

describe("GET /api/properties/:id", () => {
  test("returns the property for a valid ID", async () => {
    pool.query.mockResolvedValueOnce([[{ L_ListingID: "1000291026" }]]);

    const res = await request(app).get("/api/properties/1000291026");

    expect(res.status).toBe(200);
    expect(res.body.L_ListingID).toBe("1000291026");
  });

  test("returns 404 when property is not found", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/properties/999999999");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });

  test("returns 400 for an invalid ID (bad characters)", async () => {
    const res = await request(app).get("/api/properties/abc%2Fdef");
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("returns 400 for an oversized ID", async () => {
    const oversized = "1".repeat(50);
    const res = await request(app).get(`/api/properties/${oversized}`);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/properties/:id/openhouses", () => {
  test("returns open house events for a valid property", async () => {
    pool.query
      .mockResolvedValueOnce([[{ L_ListingID: "1077426281" }]]) // property lookup
      .mockResolvedValueOnce([[{ L_ListingID: "1077426281", OpenHouseDate: "2026-09-01" }]]); // openhouses

    const res = await request(app).get("/api/properties/1077426281/openhouses");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].L_ListingID).toBe("1077426281");
  });

  test("returns an empty array when property has no open houses", async () => {
    pool.query
      .mockResolvedValueOnce([[{ L_ListingID: "1000291026" }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/properties/1000291026/openhouses");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns 404 for an unknown property", async () => {
    pool.query.mockResolvedValueOnce([[]]); // property lookup finds nothing

    const res = await request(app).get("/api/properties/999999999/openhouses");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });

  test("returns 400 for a malformed ID", async () => {
    const res = await request(app).get("/api/properties/abc%2Fdef/openhouses");
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});