'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Close } from './icons';

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = images.length;
  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 44) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Lock scroll while the lightbox is open.
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  if (count === 0) {
    return <div className="gallery-main" style={{ cursor: 'default' }} aria-hidden />;
  }

  return (
    <div className="gallery">
      <div
        className="gallery-main"
        onClick={() => setLightbox(true)}
        role="button"
        tabIndex={0}
        aria-label="Open full-size image"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLightbox(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img key={index} src={images[index]} alt={`${alt} — photo ${index + 1}`} />
        {count > 1 && (
          <>
            <button
              className="gallery-arrow left"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              <ChevronLeft width={18} height={18} />
            </button>
            <button
              className="gallery-arrow right"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              <ChevronRight width={18} height={18} />
            </button>
            <span className="gallery-counter num">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              className={`thumb ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="lightbox"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button className="lb-btn close" aria-label="Close" onClick={() => setLightbox(false)}>
            <Close width={20} height={20} />
          </button>
          {count > 1 && (
            <button
              className="lb-btn left"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              <ChevronLeft width={22} height={22} />
            </button>
          )}
          <img src={images[index]} alt={`${alt} — photo ${index + 1}`} onClick={(e) => e.stopPropagation()} />
          {count > 1 && (
            <button
              className="lb-btn right"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              <ChevronRight width={22} height={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
