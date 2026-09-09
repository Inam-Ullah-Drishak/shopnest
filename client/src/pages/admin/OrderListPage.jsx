import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';

function OrderListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/api/orders');
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo, navigate]);

  const deliverHandler = async (id) => {
    if (!window.confirm('Mark this order as delivered?')) return;

    try {
      const { data } = await axios.put(`/api/orders/${id}/deliver`);
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order');
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-8">
      <AdminNav />

      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Delivered</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t">
                <td className="p-3">{order.user?.name || 'Deleted user'}</td>
                <td className="p-3">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">Rs {order.totalPrice}</td>
                <td className="p-3">{order.isPaid ? 'Yes' : 'No'}</td>
                <td className="p-3">{order.isDelivered ? 'Yes' : 'No'}</td>
                <td className="p-3 whitespace-nowrap">
                  <Link
                    to={`/order/${order._id}`}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    Details
                  </Link>

                  {!order.isDelivered && (
                    <button
                      onClick={() => deliverHandler(order._id)}
                      className="text-green-700 hover:underline cursor-pointer"
                    >
                      Mark Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderListPage;