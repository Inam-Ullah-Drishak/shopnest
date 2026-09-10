import { useState } from 'react';
import axios from 'axios';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { formatPrice } from '../utils/format.js';

function CouponInput({ subtotal, applied, onApply, onRemove }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const applyHandler = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError('');
    setChecking(true);

    try {
      const { data } = await axios.post('/api/coupons/validate', {
        code: code.trim(),
        subtotal,
      });

      onApply(data);
      setCode('');
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check that code');
    } finally {
      setChecking(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
        <Check size={16} className="text-green-700 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800">{applied.code}</p>
          <p className="text-xs text-green-700">
            {applied.type === 'percent'
              ? `${applied.value}% off`
              : `${formatPrice(applied.value)} off`}
            {' · '}
            saving {formatPrice(applied.discount)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          title="Remove code"
          className="p-1.5 rounded text-green-700 hover:bg-green-100 cursor-pointer shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
      >
        <Tag size={15} />
        Have a discount code?
      </button>
    );
  }

  return (
    <div>
      <form onSubmit={applyHandler} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          autoFocus
          className="flex-1 min-w-0 border rounded-lg p-2.5 text-sm uppercase"
        />

        <button
          type="submit"
          disabled={checking || !code.trim()}
          className="inline-flex items-center gap-2 border rounded-lg px-4 text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          {checking && <Loader2 size={15} className="animate-spin" />}
          Apply
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default CouponInput;