export function parsePhotos(rawPhotos) {
  if (!rawPhotos) return [];

  let photos = rawPhotos;
  if (typeof rawPhotos === "string") {
    try {
      photos = JSON.parse(rawPhotos);
    } catch {
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
      const url =
        photo.MediaURL || photo.MediaUrl || photo.mediaUrl ||
        photo.URL || photo.Url || photo.url;
      if (typeof url === "string" && url.startsWith("http")) {
        urls.push(url);
      }
    }
  }
  return urls;
}