export default function PropertyMap({ lat, lng, address }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!lat || !lng) return null;

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="property-map">
      <iframe
        title="property-location-map"
        width="100%"
        height="320"
        style={{ border: 0, borderRadius: 8 }}
        loading="lazy"
        src={embedUrl}
      />
      <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
        Get Directions
      </a>
    </div>
  );
}