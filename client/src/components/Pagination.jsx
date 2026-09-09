import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// A window of at most `size` pages that keeps the current page centred
// where possible, and stays full width at both ends.
const buildWindow = (current, total, size = 5) => {
  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(size / 2);
  let start = current - half;

  if (start < 1) start = 1;
  if (start + size - 1 > total) start = total - size + 1;

  return Array.from({ length: size }, (_, i) => start + i);
};

function Pagination({ page, pages, onChange, windowSize = 5 }) {
  if (pages <= 1) return null;

  const visible = buildWindow(page, pages, windowSize);

  const arrowClass =
    'inline-flex items-center justify-center w-10 h-10 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

  return (
    <nav
      aria-label="Pagination"
      className="flex justify-center items-center gap-2 mt-8 flex-wrap"
    >
      <button
        type="button"
        onClick={() => onChange(1)}
        disabled={page === 1}
        aria-label="First page"
        title="First page"
        className={arrowClass}
      >
        <ChevronsLeft size={16} />
      </button>

      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        title="Previous page"
        className={arrowClass}
      >
        <ChevronLeft size={16} />
      </button>

      {visible.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`w-10 h-10 rounded-lg cursor-pointer ${
            n === page
              ? 'bg-gray-900 text-white'
              : 'border hover:bg-gray-50'
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        aria-label="Next page"
        title="Next page"
        className={arrowClass}
      >
        <ChevronRight size={16} />
      </button>

      <button
        type="button"
        onClick={() => onChange(pages)}
        disabled={page === pages}
        aria-label="Last page"
        title="Last page"
        className={arrowClass}
      >
        <ChevronsRight size={16} />
      </button>
    </nav>
  );
}

export default Pagination;