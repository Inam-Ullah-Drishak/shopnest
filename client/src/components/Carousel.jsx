import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Carousel({ children, itemClass = 'w-40', gap = 'gap-4' }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;

    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();

    const el = trackRef.current;
    if (!el) return;

    // Recheck when the window resizes, since clientWidth changes
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [children]);

  const scrollBy = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-0 disabled:pointer-events-none transition cursor-pointer';

  return (
    <div className="relative group/carousel">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={atStart}
        aria-label="Scroll left"
        className={`${arrowClass} left-0 -translate-x-1/2`}
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={trackRef}
        onScroll={updateArrows}
        className={`flex ${gap} overflow-x-auto scroll-smooth pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden`}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={`${itemClass} shrink-0`}>
                {child}
              </div>
            ))
          : children}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={atEnd}
        aria-label="Scroll right"
        className={`${arrowClass} right-0 translate-x-1/2`}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export default Carousel;