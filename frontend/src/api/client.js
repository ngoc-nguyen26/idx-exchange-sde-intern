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

async function safeFetch(url) {
  try {
    return await fetch(url);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Unable to reach the server. Is the backend running on port 5000?");
    }
    throw err;
  }
}

export async function fetchProperties(params = {}) {
  const queryString = buildQueryString(params);
  const response = await safeFetch(`${BASE_URL}${queryString}`);
  return handleResponse(response);
}

export async function fetchPropertyDetail(id) {
  const response = await safeFetch(`${BASE_URL}/${encodeURIComponent(id)}`);
  return handleResponse(response);
}