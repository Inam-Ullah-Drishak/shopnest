import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield,
  Ban,
  Mail,
  Calendar,
  Wallet,
  ShoppingBag,
  Star,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import OrderStatus, { STATUS_META } from '../../components/OrderStatus.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-500">{label}</p>
        <Icon size={16} className="text-gray-400" />
      </div>
      <p className="text-xl font-bold mt-1.5">{value}</p>
    </div>
  );
}

function CustomerDetailPage() {
  const { id } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate('/login');
  }, [userInfo, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await axios.get(`/api/customers/${id}`);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this customer');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const applyUser = (updated) =>
    setData((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));

  const roleHandler = async () => {
    const making = !data.user.isAdmin;

    if (
      !window.confirm(
        making
          ? `Give ${data.user.name} full admin access?`
          : `Remove admin access from ${data.user.name}?`
      )
    )
      return;

    setBusy(true);
    setError('');

    try {
      const { data: res } = await axios.put(`/api/customers/${id}/role`, {
        isAdmin: making,
      });

      applyUser(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the role');
    } finally {
      setBusy(false);
    }
  };

  const blockHandler = async () => {
    const blocking = !data.user.isBlocked;

    if (
      !window.confirm(
        blocking
          ? `Suspend ${data.user.name}? They will not be able to sign in.`
          : `Restore access for ${data.user.name}?`
      )
    )
      return;

    setBusy(true);
    setError('');

    try {
      const { data: res } = await axios.put(`/api/customers/${id}/block`, {
        isBlocked: blocking,
      });

      applyUser(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this account');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <AdminNav />
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading customer
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8">
        <AdminNav />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { user, stats, statusCounts, recentOrders } = data;
  const isSelf = user._id === userInfo?._id;

  return (
    <div className="p-8">
      <AdminNav />

      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        All customers
      </Link>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mt-4">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-start gap-4 mt-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-600">
            {user.name.charAt(0).toUpperCase()}
          </span>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{user.name}</h1>

              {user.isAdmin && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                  <Shield size={12} />
                  Admin
                </span>
              )}

              {user.isBlocked && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                  <Ban size={12} />
                  Suspended
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {!isSelf && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={roleHandler}
              disabled={busy}
              className="inline-flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Shield size={15} />
              )}
              {user.isAdmin ? 'Remove admin' : 'Make admin'}
            </button>

            <button
              type="button"
              onClick={blockHandler}
              disabled={busy || user.isAdmin}
              title={user.isAdmin ? 'Remove admin access first' : undefined}
              className="inline-flex items-center gap-2 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Ban size={15} />
              {user.isBlocked ? 'Restore access' : 'Suspend'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat
          icon={Wallet}
          label="Lifetime spend"
          value={formatPrice(stats.totalSpent)}
        />
        <Stat
          icon={ShoppingBag}
          label="Orders"
          value={`${stats.totalOrders} (${stats.paidOrders} paid)`}
        />
        <Stat
          icon={Package}
          label="Average order"
          value={formatPrice(stats.averageOrder)}
        />
        <Stat icon={Star} label="Reviews left" value={stats.reviews} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-5 h-fit">
          <h2 className="font-bold mb-4">Order breakdown</h2>

          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, n]) => (
                  <Link
                    key={status}
                    to={`/admin/orders?status=${status}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <OrderStatus status={status} />
                    <span className="text-sm text-gray-600">{n}</span>
                  </Link>
                ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 border rounded-lg p-5">
          <h2 className="font-bold mb-4">Recent orders</h2>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">
              This customer has not ordered anything yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  to={`/order/${order._id}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {formatPrice(order.totalPrice)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)} ·{' '}
                      {order.orderItems.length} item
                      {order.orderItems.length > 1 ? 's' : ''}
                      {order.couponCode && ` · ${order.couponCode}`}
                    </p>
                  </div>

                  <OrderStatus status={order.status} />

                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailPage;