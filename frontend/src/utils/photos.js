// Normalize different photo formats into a consistent array of URLs for the UI.
export function parsePhotos(rawPhotos) {
  if (!rawPhotos) return [];

  let photos = rawPhotos;

  if (typeof rawPhotos === "string") {
    try {
      photos = JSON.parse(rawPhotos);
    } catch {
      // Ignore malformed photo data so one bad listing does not break the page.
      return [];
    }
  }

  if (!Array.isArray(photos)) return [];

  const urls = [];

  for (const photo of photos) {
    if (typeof photo === "string" && photo.trim().startsWith("http")) {
      urls.push(photo.trim());
      continue;
    }

    if (photo && typeof photo === "object") {
      // Support different URL key formats used by the photo data sources.
      const url =
        photo.MediaURL ||
        photo.MediaUrl ||
        photo.mediaUrl ||
        photo.URL ||
        photo.Url ||
        photo.url;

      if (typeof url === "string" && url.startsWith("http")) {
        urls.push(url);
      }
    }
  }

  return urls;
}