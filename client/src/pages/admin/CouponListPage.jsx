import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Ticket,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import Pagination from '../../components/Pagination.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { PAGE_SIZE } from '../../utils/constants.js';

// A coupon can be inactive for several reasons; say which
const statusOf = (coupon) => {
  const now = new Date();

  if (!coupon.isActive) return { label: 'Paused', tone: 'gray' };

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now)
    return { label: 'Expired', tone: 'red' };

  if (coupon.startsAt && new Date(coupon.startsAt) > now)
    return { label: 'Scheduled', tone: 'blue' };

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { label: 'Used up', tone: 'red' };

  return { label: 'Live', tone: 'green' };
};

const tones = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
};

function CouponListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page')) || 1;

  const [coupons, setCoupons] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate('/login');
  }, [userInfo, navigate]);

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/coupons', {
          params: { status, pageNumber: page, pageSize: PAGE_SIZE },
        });

        setCoupons(data.coupons);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load coupons');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [status, page]);

  const setParam = (changes) => {
    const next = { status, page: 1, ...changes };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === 'all') delete next[k];
    });

    setSearchParams(next);
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const deleteHandler = async (coupon) => {
    if (!window.confirm(`Delete "${coupon.code}"?`)) return;

    setDeletingId(coupon._id);
    setError('');

    try {
      await axios.delete(`/api/coupons/${coupon._id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
      setCount((c) => c - 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this coupon');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading' : `${count} code${count === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Dropdown
            value={status}
            onChange={(v) => setParam({ status: v })}
            options={[
              { value: 'all', label: 'All coupons' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Paused' },
            ]}
            className="w-40"
            align="right"
          />

          <Link
            to="/admin/coupon/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
          >
            <Plus size={18} />
            New coupon
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading coupons
        </div>
      ) : coupons.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <Ticket size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No coupons yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create a discount code to run a promotion.
          </p>
          <Link
            to="/admin/coupon/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            <Plus size={18} />
            New coupon
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Discount</th>
                  <th className="p-3 font-medium">Conditions</th>
                  <th className="p-3 font-medium">Used</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((coupon) => {
                  const state = statusOf(coupon);

                  return (
                    <tr key={coupon._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">
                            {coupon.code}
                          </span>

                          <button
                            type="button"
                            onClick={() => copyCode(coupon.code)}
                            title="Copy code"
                            className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-200 cursor-pointer"
                          >
                            {copied === coupon.code ? (
                              <Check size={13} className="text-green-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {coupon.type === 'percent'
                          ? `${coupon.value}%`
                          : formatPrice(coupon.value)}

                        {coupon.maxDiscount && (
                          <p className="text-xs text-gray-500">
                            up to {formatPrice(coupon.maxDiscount)}
                          </p>
                        )}
                      </td>

                      <td className="p-3 text-xs text-gray-500">
                        {coupon.minOrderValue > 0 && (
                          <p>Min {formatPrice(coupon.minOrderValue)}</p>
                        )}
                        {coupon.expiresAt && (
                          <p>Ends {formatDate(coupon.expiresAt)}</p>
                        )}
                        {coupon.minOrderValue === 0 && !coupon.expiresAt && (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>

                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {coupon.usedCount}
                        {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                            tones[state.tone]
                          }`}
                        >
                          {state.label}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Link
                            to={`/admin/coupon/${coupon._id}/edit`}
                            title="Edit"
                            className="p-2 rounded hover:bg-gray-200 text-gray-600"
                          >
                            <Pencil size={16} />
                          </Link>

                          <button
                            onClick={() => deleteHandler(coupon)}
                            disabled={deletingId === coupon._id}
                            title="Delete"
                            className="p-2 rounded hover:bg-red-100 text-red-600 disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === coupon._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} onChange={(n) => setParam({ page: n })} />
        </>
      )}
    </div>
  );
}

export default CouponListPage;