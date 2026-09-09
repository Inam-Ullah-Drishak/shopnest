import { Minus, Plus } from 'lucide-react';

function QuantityInput({ value, onChange, max = 99, min = 1, id }) {
  const clamp = (n) => Math.min(Math.max(n, min), max);

  // Allow an empty field while typing, clamp on blur
  const handleType = (e) => {
    const raw = e.target.value;

    if (raw === '') {
      onChange('');
      return;
    }

    const num = Number(raw);
    if (Number.isInteger(num)) onChange(clamp(num));
  };

  const handleBlur = () => {
    if (value === '' || Number.isNaN(Number(value))) onChange(min);
  };

  const current = Number(value) || min;

  return (
    <div className="inline-flex items-center border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(clamp(current - 1))}
        disabled={current <= min}
        aria-label="Decrease quantity"
        className="px-3 py-2.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus size={15} />
      </button>

      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={handleType}
        onBlur={handleBlur}
        min={min}
        max={max}
        className="w-14 text-center border-x py-2.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(current + 1))}
        disabled={current >= max}
        aria-label="Increase quantity"
        className="px-3 py-2.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

export default QuantityInput;