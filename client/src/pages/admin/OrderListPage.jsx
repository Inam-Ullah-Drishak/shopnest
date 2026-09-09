import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Eye,
  Truck,
  Loader2,
  AlertCircle,
  Inbox,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import Pagination from '../../components/Pagination.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { PAGE_SIZE } from '../../utils/constants.js';

function YesNo({ value, yes, no }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
        value ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {value ? <CheckCircle2 size={13} /> : <Clock size={13} />}
      {value ? yes : no}
    </span>
  );
}

function OrderListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const filtersActive = status !== 'all';

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/orders', {
          params: { status, pageNumber: page, pageSize: PAGE_SIZE },
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
  }, [status, page]);

  const setParam = (changes) => {
    const next = { status, page: 1, ...changes };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === 'all') delete next[k];
    });

    setSearchParams(next);
  };

  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deliverHandler = async (id) => {
    if (!window.confirm('Mark this order as delivered? Stock will be reduced.'))
      return;

    setUpdatingId(id);
    setError('');

    try {
      const { data } = await axios.put(`/api/orders/${id}/deliver`);
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)));
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
            {filtersActive && !loading && ' matching your filter'}
          </p>
        </div>

        <div className="flex gap-2">
          <Dropdown
            value={status}
            onChange={(v) => setParam({ status: v })}
            options={[
              { value: 'all', label: 'All orders' },
              { value: 'pending', label: 'Not delivered' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'unpaid', label: 'Unpaid' },
            ]}
            className="w-44"
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
              ? 'Try a different filter.'
              : 'Orders will appear here as customers buy.'}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 mt-5 cursor-pointer"
            >
              <X size={16} />
              Clear filter
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
                  <th className="p-3 font-medium">Payment</th>
                  <th className="p-3 font-medium">Delivery</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium">
                        {order.user?.name || 'Deleted user'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.email}
                      </p>
                    </td>

                    <td className="p-3 text-gray-600 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="p-3 text-gray-600">
                      {order.orderItems.length}
                    </td>

                    <td className="p-3 font-medium whitespace-nowrap">
                      {formatPrice(order.totalPrice)}
                    </td>

                    <td className="p-3">
                      <YesNo value={order.isPaid} yes="Paid" no="Unpaid" />
                    </td>

                    <td className="p-3">
                      <YesNo
                        value={order.isDelivered}
                        yes="Delivered"
                        no="Pending"
                      />
                    </td>

                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Link
                          to={`/order/${order._id}`}
                          title="View order"
                          className="p-2 rounded hover:bg-gray-200 text-gray-600"
                        >
                          <Eye size={16} />
                        </Link>

                        {!order.isDelivered && (
                          <button
                            onClick={() => deliverHandler(order._id)}
                            disabled={updatingId === order._id}
                            title="Mark delivered"
                            className="p-2 rounded hover:bg-green-100 text-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            {updatingId === order._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Truck size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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