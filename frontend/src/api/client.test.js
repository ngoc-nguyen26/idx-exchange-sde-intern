import { fetchProperties, fetchPropertyDetail } from "./client";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

// Test 1: fetchProperties returns API data
test("fetchProperties returns the data it gets back from the API", async () => {
  const mockData = {
    total: 1,
    limit: 20,
    offset: 0,
    results: [{ L_ListingID: "123" }],
  };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockData,
  });

  const result = await fetchProperties();

  expect(global.fetch).toHaveBeenCalledWith("/api/properties");
  expect(result).toEqual(mockData);
});

// Test 2: fetchProperties builds query string and skips empty filters
test("fetchProperties builds the query string and skips empty filter values", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ total: 0, limit: 20, offset: 0, results: [] }),
  });

  await fetchProperties({
    city: "Naperville",
    zipcode: "",
    minPrice: "150000",
    beds: "3",
  });

  expect(global.fetch).toHaveBeenCalledWith(
    "/api/properties?city=Naperville&minPrice=150000&beds=3"
  );
});

// Test 3: fetchProperties throws error on failed response
test("fetchProperties throws a meaningful error on a failed response", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => ({ error: "minPrice must be a valid integer" }),
  });

  await expect(fetchProperties({ minPrice: "abc" })).rejects.toThrow(
    "minPrice must be a valid integer"
  );
});

// Test 4: fetchPropertyDetail requests correct property by id
test("fetchPropertyDetail requests the correct listing by id", async () => {
  const mockProperty = {
    L_ListingID: "1115119412",
    L_Address: "1810 W Bushell Street",
  };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockProperty,
  });

  const result = await fetchPropertyDetail("1115119412");

  expect(global.fetch).toHaveBeenCalledWith("/api/properties/1115119412");
  expect(result).toEqual(mockProperty);
});