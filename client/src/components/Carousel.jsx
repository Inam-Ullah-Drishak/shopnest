import { useRef, useState, useEffect, useCallback } from 'react';

function Carousel({ children, itemClass = 'w-40', gap = 'gap-4' }) {
  const trackRef = useRef(null);
  const [steps, setSteps] = useState(1);
  const [current, setCurrent] = useState(0);

  // Distance from one item to the next, gap included
  const stepWidth = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.children.length === 0) return 0;

    if (el.children.length > 1) {
      return el.children[1].offsetLeft - el.children[0].offsetLeft;
    }

    return el.children[0].offsetWidth;
  }, []);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const step = stepWidth();
    if (!step) return;

    const count = el.children.length;
    const visible = Math.max(1, Math.round(el.clientWidth / step));

    // The last position is where the final item sits flush at the right edge
    setSteps(Math.max(1, count - visible + 1));
    setCurrent(Math.round(el.scrollLeft / step));
  }, [stepWidth]);

  useEffect(() => {
    measure();

    const el = trackRef.current;
    if (!el) return;

    // Images loading late change the layout, so watch for resizes
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [children, measure]);

  const goTo = (index) => {
    const el = trackRef.current;
    if (!el) return;

    el.scrollTo({ left: index * stepWidth(), behavior: 'smooth' });
  };

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={measure}
        className={`flex ${gap} overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden`}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={`${itemClass} shrink-0 snap-start`}>
                {child}
              </div>
            ))
          : children}
      </div>

      {steps > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-4">
          {[...Array(steps).keys()].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to item ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === current
                  ? 'w-6 bg-gray-900'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Carousel;