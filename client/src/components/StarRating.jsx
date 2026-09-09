import { Star } from 'lucide-react';

function StarRating({ value = 0, count, size = 14, showCount = true }) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = rounded >= n;
          const half = !filled && rounded >= n - 0.5;

          return (
            <span key={n} className="relative inline-block">
              <Star size={size} className="text-gray-300" />

              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? '50%' : '100%' }}
                >
                  <Star
                    size={size}
                    className="text-amber-400 fill-amber-400"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showCount && count !== undefined && (
        <span className="text-xs text-gray-500">
          {count > 0 ? `${value.toFixed(1)} (${count})` : 'No reviews'}
        </span>
      )}
    </div>
  );
}

export default StarRating;