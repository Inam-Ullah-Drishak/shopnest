import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Package,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Pagination from '../components/Pagination.jsx';
import { formatPrice, formatDate } from '../utils/format.js';
import { PAGE_SIZE } from '../utils/constants.js';

function MyOrdersPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!userInfo) return;

    const fetchOrders = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/orders/mine', {
          params: { pageNumber: page, pageSize: PAGE_SIZE },
        });

        setOrders(data.orders);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo, page]);

  const pageHandler = (n) => {
    setSearchParams({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading your orders
      </div>
    );
  }

  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Your orders</h1>

      {count > 0 && (
        <p className="text-sm text-gray-500 mt-0.5 mb-6">
          {count} order{count === 1 ? '' : 's'}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="border rounded-lg py-16 text-center mt-6">
          <Package size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No orders yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Anything you buy will show up here.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/order/${order._id}`}
                className="flex items-center gap-4 border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{formatPrice(order.totalPrice)}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)} · {order.orderItems.length}{' '}
                    item{order.orderItems.length > 1 ? 's' : ''}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs shrink-0 ${
                    order.isDelivered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {order.isDelivered ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Clock size={13} />
                  )}
                  {order.isDelivered ? 'Delivered' : 'On the way'}
                </span>

                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}
    </div>
  );
}

export default MyOrdersPage;