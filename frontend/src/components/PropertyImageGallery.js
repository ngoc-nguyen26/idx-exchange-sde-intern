import { useEffect, useRef, useState } from "react";
import { parsePhotos } from "../utils/photos";
import "./PropertyImageGallery.css";

export default function PropertyImageGallery({ photos: rawPhotos, alt }) {
  const photos = parsePhotos(rawPhotos);
  const [mainIndex, setMainIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (lightboxOpen && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [lightboxOpen]);

  if (photos.length === 0) {
    return <div className="property-image-placeholder">No photos available</div>;
  }

  const goPrev = () => setMainIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  const goNext = () => setMainIndex((i) => (i === photos.length - 1 ? 0 : i + 1));

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setLightboxOpen(false);
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  };

  return (
    <div className="property-image-gallery">
      <img
        className="gallery-main-image"
        src={photos[mainIndex]}
        alt={alt || "Property"}
        onClick={() => setLightboxOpen(true)}
      />

      {photos.length > 1 && (
        <div className="gallery-thumb-strip">
          {photos.map((url, i) => (
            <img
              key={url + i}
              src={url}
              alt={`Thumbnail ${i + 1}`}
              className={i === mainIndex ? "thumb active" : "thumb"}
              onClick={() => setMainIndex(i)}
            />
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div
            className="lightbox-content"
            ref={lightboxRef}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
              ✕
            </button>
            <img src={photos[mainIndex]} alt={alt || "Property"} />
            {photos.length > 1 && (
              <>
                <button className="lightbox-arrow left" onClick={goPrev}>‹</button>
                <button className="lightbox-arrow right" onClick={goNext}>›</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}