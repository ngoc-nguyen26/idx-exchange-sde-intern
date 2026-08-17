const BASE_URL = "/api/properties";

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch {
      // If response is not JSON, keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

async function fetchWithOptionalSignal(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Unable to reach the server. Is the backend running on port 5000?");
    }
    throw err;
  }
}

export async function fetchProperties(params = {}, options = {}) {
  const queryString = buildQueryString(params);
  return fetchWithOptionalSignal(`${BASE_URL}${queryString}`, options);
}

export async function fetchPropertyDetail(id, options = {}) {
  return fetchWithOptionalSignal(`${BASE_URL}/${encodeURIComponent(id)}`, options);
}

export async function fetchPropertyOpenHouses(id, options = {}) {
  return fetchWithOptionalSignal(`${BASE_URL}/${encodeURIComponent(id)}/openhouses`, options);
}

export async function fetchOpenHouses(
  { startDate, endDate, city, zipcode, minPrice, maxPrice, beds, baths } = {},
  options = {}
) {
  const queryString = buildQueryString({
    startDate,
    endDate,
    city,
    zipcode,
    minPrice,
    maxPrice,
    beds,
    baths,
  });
  return fetchWithOptionalSignal(`/api/openhouses${queryString}`, options);
}