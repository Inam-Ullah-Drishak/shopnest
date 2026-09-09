import { useState } from 'react';
import { ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';

function ImageGallery({ images = [], alt = '' }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 rounded-lg border flex items-center justify-center">
        <ImageOff size={40} className="text-gray-300" />
      </div>
    );
  }

  const prev = () =>
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));

  const next = () =>
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div>
      <div className="relative aspect-square bg-gray-50 rounded-lg border overflow-hidden">
        <img
          src={images[index]}
          alt={alt}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>

            <span className="absolute bottom-2 right-2 bg-gray-900/70 text-white text-xs px-2 py-1 rounded">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer ${
                i === index
                  ? 'border-gray-900'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;