import { useState } from "react";
import { parsePhotos } from "../utils/photos";
import "./PropertyImageCarousel.css";

export default function PropertyImageCarousel({ photos: rawPhotos, alt }) {
  const photos = parsePhotos(rawPhotos);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="property-image-wrapper">
        <div className="property-image-placeholder">No photo available</div>
      </div>
    );
  }

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  };
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="property-image-wrapper">
      <img className="property-image" src={photos[index]} alt={alt || "Property"} />
      {photos.length > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous photo">
            ‹
          </button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next photo">
            ›
          </button>
          <span className="carousel-counter">{index + 1} / {photos.length}</span>
        </>
      )}
    </div>
  );
}