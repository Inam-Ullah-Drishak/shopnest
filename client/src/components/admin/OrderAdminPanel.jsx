import { useState } from 'react';
import axios from 'axios';
import {
  Loader2,
  Save,
  Truck,
  StickyNote,
  Undo2,
  Check,
  History,
} from 'lucide-react';
import OrderStatus, { STATUS_META } from '../OrderStatus.jsx';
import { formatDate } from '../../utils/format.js';

function OrderAdminPanel({ order, onChange }) {
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [courier, setCourier] = useState(order.courier || '');
  const [notes, setNotes] = useState(order.internalNotes || '');

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState('');

  const saveDetails = async () => {
    setSaving(true);
    setError('');

    try {
      const { data } = await axios.put(`/api/orders/${order._id}/details`, {
        trackingNumber: tracking,
        courier,
        internalNotes: notes,
      });

      onChange(data);
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const refundHandler = async () => {
    const note = window.prompt('Refund note (optional)', '');
    if (note === null) return;

    setRefunding(true);
    setError('');

    try {
      const { data } = await axios.put(`/api/orders/${order._id}/refund`, {
        note,
      });

      onChange(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not refund');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-bold">Staff only</p>
        <OrderStatus status={order.status} />
      </div>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="courier"
            className="block mb-1 text-sm font-medium"
          >
            Courier
          </label>
          <input
            id="courier"
            type="text"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="TCS, Leopards"
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="tracking"
            className="block mb-1 text-sm font-medium"
          >
            Tracking number
          </label>
          <input
            id="tracking"
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="TCS123456789"
            className="w-full border rounded-lg p-2.5 text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="flex items-center gap-1.5 mb-1 text-sm font-medium"
        >
          <StickyNote size={14} className="text-gray-400" />
          Internal notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="3"
          placeholder="Not visible to the customer"
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveDetails}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : savedAt ? (
            <Check size={15} />
          ) : (
            <Save size={15} />
          )}
          {savedAt ? 'Saved' : 'Save details'}
        </button>

        {order.isPaid && !order.isRefunded && (
          <button
            type="button"
            onClick={refundHandler}
            disabled={refunding}
            className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 cursor-pointer"
          >
            {refunding ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Undo2 size={15} />
            )}
            Mark refunded
          </button>
        )}

        {order.isRefunded && (
          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-2.5 rounded-lg text-sm">
            <Undo2 size={15} />
            Refunded {order.refundedAt && formatDate(order.refundedAt)}
          </span>
        )}
      </div>

      {order.statusHistory?.length > 0 && (
        <div className="border-t pt-4">
          <p className="flex items-center gap-1.5 text-sm font-medium mb-3">
            <History size={14} className="text-gray-400" />
            History
          </p>

          <div className="space-y-2">
            {[...order.statusHistory].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    STATUS_META[h.status]?.dot || 'bg-gray-300'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <p>
                    {STATUS_META[h.status]?.label || h.status}
                    {h.note && (
                      <span className="text-gray-500"> · {h.note}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(h.at)}
                    {h.changedBy?.name && ` · ${h.changedBy.name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.stockAdjusted && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Truck size={13} />
          Stock has been taken for this order.
        </p>
      )}
    </div>
  );
}

export default OrderAdminPanel;