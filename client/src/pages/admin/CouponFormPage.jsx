import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, AlertCircle, Shuffle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import { formatPrice } from '../../utils/format.js';
import { usePageTitle } from "../../hooks/usePageTitle.js";

// Date inputs need yyyy-mm-dd, not an ISO timestamp
const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const randomCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, easy to misread
  const digits = '23456789';

  let code = '';
  for (let i = 0; i < 4; i += 1)
    code += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i += 1)
    code += digits[Math.floor(Math.random() * digits.length)];

  return code;
};

function CouponFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percent',
    value: '',
    maxDiscount: '',
    minOrderValue: '',
    startsAt: '',
    expiresAt: '',
    usageLimit: '',
    perUserLimit: '1',
    isActive: true,
  });

  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  usePageTitle(isEdit ? 'Edit coupon' : 'New coupon');
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate('/login');
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!isEdit) return;

    const fetchCoupon = async () => {
      try {
        const { data } = await axios.get(`/api/coupons/${id}`);

        setForm({
          code: data.code,
          description: data.description || '',
          type: data.type,
          value: data.value,
          maxDiscount: data.maxDiscount ?? '',
          minOrderValue: data.minOrderValue || '',
          startsAt: toDateInput(data.startsAt),
          expiresAt: toDateInput(data.expiresAt),
          usageLimit: data.usageLimit ?? '',
          perUserLimit: data.perUserLimit ?? '',
          isActive: data.isActive,
        });

        setUsage({ count: data.usedCount, users: data.usedBy || [] });
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this coupon');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, [id, isEdit]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Empty string means "no limit", which the API reads as null
    const payload = {
      code: form.code,
      description: form.description,
      type: form.type,
      value: Number(form.value),
      maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
      minOrderValue: Number(form.minOrderValue) || 0,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      perUserLimit: form.perUserLimit === '' ? null : Number(form.perUserLimit),
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await axios.put(`/api/coupons/${id}`, payload);
      } else {
        await axios.post('/api/coupons', payload);
      }

      navigate('/admin/coupons');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this coupon');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading coupon
      </div>
    );
  }

  const isPercent = form.type === 'percent';

  // Show the admin what this actually does to a real order
  const example = 10000;
  const raw = isPercent
    ? (example * (Number(form.value) || 0)) / 100
    : Number(form.value) || 0;

  const capped =
    form.maxDiscount !== '' && raw > Number(form.maxDiscount)
      ? Number(form.maxDiscount)
      : raw;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link
        to="/admin/coupons"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        All coupons
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">
        {isEdit ? 'Edit coupon' : 'New coupon'}
      </h1>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={submitHandler} className="space-y-6">
        <div>
          <label htmlFor="code" className="block mb-1 font-medium text-sm">
            Code
          </label>

          <div className="flex gap-2">
            <input
              id="code"
              type="text"
              value={form.code}
              onChange={(e) => setField('code', e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="flex-1 border rounded-lg p-2.5 font-mono uppercase"
              required
            />

            <button
              type="button"
              onClick={() => setField('code', randomCode())}
              title="Generate a random code"
              className="inline-flex items-center gap-2 border rounded-lg px-4 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <Shuffle size={15} />
              Random
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Customers type this at checkout. Case doesn't matter.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block mb-1 font-medium text-sm"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="10% off your first order"
            className="w-full border rounded-lg p-2.5"
          />
          <p className="text-xs text-gray-500 mt-1">
            Shown to the customer when the code is applied.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="block mb-1 font-medium text-sm">Type</p>
            <Dropdown
              value={form.type}
              onChange={(v) => setField('type', v)}
              options={[
                { value: 'percent', label: 'Percentage off' },
                { value: 'fixed', label: 'Fixed amount off' },
              ]}
            />
          </div>

          <div>
            <label htmlFor="value" className="block mb-1 font-medium text-sm">
              {isPercent ? 'Percentage' : 'Amount (Rs)'}
            </label>
            <input
              id="value"
              type="number"
              min="1"
              max={isPercent ? 100 : undefined}
              value={form.value}
              onChange={(e) => setField('value', e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
            />
          </div>
        </div>

        {isPercent && (
          <div>
            <label htmlFor="maxdisc" className="block mb-1 font-medium text-sm">
              Maximum discount (Rs)
            </label>
            <input
              id="maxdisc"
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={(e) => setField('maxDiscount', e.target.value)}
              placeholder="No cap"
              className="w-full border rounded-lg p-2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Stops a percentage code costing too much on a large order.
            </p>
          </div>
        )}

        {Number(form.value) > 0 && (
          <div className="bg-gray-50 border rounded-lg p-3 text-sm">
            On a {formatPrice(example)} order this takes off{' '}
            <span className="font-medium">{formatPrice(capped)}</span>
            {capped !== raw && ' (capped)'}, leaving{' '}
            {formatPrice(example - capped)}.
          </div>
        )}

        <div>
          <label htmlFor="minorder" className="block mb-1 font-medium text-sm">
            Minimum order value (Rs)
          </label>
          <input
            id="minorder"
            type="number"
            min="0"
            value={form.minOrderValue}
            onChange={(e) => setField('minOrderValue', e.target.value)}
            placeholder="0"
            className="w-full border rounded-lg p-2.5"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="starts" className="block mb-1 font-medium text-sm">
              Starts
            </label>
            <input
              id="starts"
              type="date"
              value={form.startsAt}
              onChange={(e) => setField('startsAt', e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label htmlFor="ends" className="block mb-1 font-medium text-sm">
              Expires
            </label>
            <input
              id="ends"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setField('expiresAt', e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to never expire.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="uses" className="block mb-1 font-medium text-sm">
              Total uses
            </label>
            <input
              id="uses"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => setField('usageLimit', e.target.value)}
              placeholder="Unlimited"
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label htmlFor="peruser" className="block mb-1 font-medium text-sm">
              Uses per customer
            </label>
            <input
              id="peruser"
              type="number"
              min="1"
              value={form.perUserLimit}
              onChange={(e) => setField('perUserLimit', e.target.value)}
              placeholder="Unlimited"
              className="w-full border rounded-lg p-2.5"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setField('isActive', e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">Active</span>
        </label>

        {usage && usage.count > 0 && (
          <div className="border rounded-lg p-4">
            <p className="font-medium text-sm mb-2">
              Redeemed {usage.count} time{usage.count === 1 ? '' : 's'}
            </p>

            <div className="space-y-1">
              {usage.users.slice(0, 8).map((u, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {u.user?.name || 'Deleted user'}
                  {u.count > 1 && ` · ${u.count} times`}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Save changes' : 'Create coupon'}
          </button>

          <Link
            to="/admin/coupons"
            className="px-5 py-2.5 rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default CouponFormPage;