import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Eye, Loader2, AlertCircle, Inbox, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import Pagination from '../../components/Pagination.jsx';
import OrderStatus, { STATUS_META } from '../../components/OrderStatus.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { PAGE_SIZE } from '../../utils/constants.js';

// Mirrors NEXT_STATUSES on the server, so we only offer legal moves
const NEXT = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

function OrderListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const filtersActive = status !== 'all' || from || to;

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate('/login');
  }, [userInfo, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/orders', {
          params: {
            status,
            from: from || undefined,
            to: to || undefined,
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });

        setOrders(data.orders);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [status, from, to, page]);

  const setParam = (changes) => {
    const next = { status, from, to, page: 1, ...changes };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === 'all') delete next[k];
    });

    setSearchParams(next);
  };

  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const advance = async (order, nextStatus) => {
    const label = STATUS_META[nextStatus].label.toLowerCase();

    const warning =
      nextStatus === 'shipped'
        ? ' Stock will be reduced.'
        : nextStatus === 'cancelled' && order.stockAdjusted
        ? ' Stock will be returned.'
        : '';

    if (!window.confirm(`Mark this order as ${label}?${warning}`)) return;

    setUpdatingId(order._id);
    setError('');

    try {
      const { data } = await axios.put(`/api/orders/${order._id}/status`, {
        status: nextStatus,
      });

      setOrders((prev) => prev.map((o) => (o._id === order._id ? data : o)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading' : `${count} order${count === 1 ? '' : 's'}`}
            {filtersActive && !loading && ' matching your filters'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={from}
            onChange={(e) => setParam({ from: e.target.value })}
            className="border rounded-lg p-2.5 text-sm"
            aria-label="From date"
          />

          <span className="text-gray-400 text-sm">to</span>

          <input
            type="date"
            value={to}
            onChange={(e) => setParam({ to: e.target.value })}
            className="border rounded-lg p-2.5 text-sm"
            aria-label="To date"
          />

          <Dropdown
            value={status}
            onChange={(v) => setParam({ status: v })}
            options={[
              { value: 'all', label: 'All orders' },
              { value: 'open', label: 'Open orders' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'unpaid', label: 'Unpaid' },
            ]}
            className="w-40"
            align="right"
          />

          {filtersActive && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-1.5 border rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <X size={15} />
              Clear
            </button>
          )}
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
          Loading orders
        </div>
      ) : orders.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <Inbox size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">
            {filtersActive ? 'No orders match' : 'No orders yet'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filtersActive
              ? 'Try a different filter or date range.'
              : 'Orders will appear here as customers buy.'}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 mt-5 cursor-pointer"
            >
              <X size={16} />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Items</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Next step</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const options = NEXT[order.status] || [];
                  const forward = options.find((s) => s !== 'cancelled');
                  const busy = updatingId === order._id;

                  return (
                    <tr key={order._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium">
                          {order.user?.name || 'Deleted user'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.shippingAddress?.city}
                        </p>
                      </td>

                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="p-3 text-gray-600">
                        {order.orderItems.length}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <p className="font-medium">
                          {formatPrice(order.totalPrice)}
                        </p>
                        {order.discountAmount > 0 && (
                          <p className="text-xs text-green-700">
                            {order.couponCode} · −
                            {formatPrice(order.discountAmount)}
                          </p>
                        )}
                      </td>

                      <td className="p-3">
                        <OrderStatus status={order.status} />
                        {!order.isPaid && order.status !== 'cancelled' && (
                          <p className="text-xs text-gray-500 mt-1">Unpaid</p>
                        )}
                      </td>

                      <td className="p-3">
                        {options.length === 0 ? (
                          <span className="text-xs text-gray-400">Closed</span>
                        ) : (
                          <div className="flex gap-1.5">
                            {forward && (
                              <button
                                onClick={() => advance(order, forward)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                {busy ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <ArrowRight size={13} />
                                )}
                                {STATUS_META[forward].label}
                              </button>
                            )}

                            <button
                              onClick={() => advance(order, 'cancelled')}
                              disabled={busy}
                              title="Cancel order"
                              className="p-1.5 rounded text-red-600 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <Link
                          to={`/order/${order._id}`}
                          title="View order"
                          className="p-2 rounded hover:bg-gray-200 text-gray-600 inline-flex"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}
    </div>
  );
}

export default OrderListPage;