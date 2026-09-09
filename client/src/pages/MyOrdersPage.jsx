import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

function MyOrdersPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/api/orders/mine');
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo, navigate]);

  if (loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">My Orders</h1>
        <p className="text-gray-600">
          You have no orders yet.{' '}
          <Link to="/" className="text-blue-600 underline">
            Start shopping
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order._id}
            to={`/order/${order._id}`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">Rs {order.totalPrice}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                  {order.orderItems.length} item(s)
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.isPaid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {order.isPaid ? 'Paid' : 'Not Paid'}
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.isDelivered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.isDelivered ? 'Delivered' : 'Pending'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MyOrdersPage;