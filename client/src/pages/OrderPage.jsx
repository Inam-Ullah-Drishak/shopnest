import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function OrderPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/api/orders/${id}`);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Order Placed</h1>
      <p className="text-gray-500 text-sm mb-6">Order ID: {order._id}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded p-4">
            <h2 className="font-bold mb-2">Shipping</h2>
            <p className="text-gray-600">
              {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.postalCode},{' '}
              {order.shippingAddress.country}
            </p>
            <p className="text-gray-600">
              Phone: {order.shippingAddress.phone}
            </p>

            <p className="mt-3">
              {order.isDelivered ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                  Delivered
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm">
                  Not Delivered
                </span>
              )}
            </p>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-bold mb-2">Payment</h2>
            <p className="text-gray-600">{order.paymentMethod}</p>

            <p className="mt-3">
              {order.isPaid ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                  Paid
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm">
                  Not Paid
                </span>
              )}
            </p>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-bold mb-4">Items</h2>

            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <Link
                    to={`/product/${item.product}`}
                    className="hover:underline flex-1 min-w-0 truncate"
                  >
                    {item.name}
                  </Link>
                  <span className="ml-4 shrink-0">
                    {item.qty} x Rs {item.price} = Rs {item.qty * item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Summary</h2>

          <div className="flex justify-between mb-2">
            <span>Items</span>
            <span>Rs {order.itemsPrice}</span>
          </div>

          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>
              {order.shippingPrice === 0 ? 'Free' : `Rs ${order.shippingPrice}`}
            </span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total</span>
            <span>Rs {order.totalPrice}</span>
          </div>

          <Link
            to="/"
            className="block text-center w-full bg-gray-900 text-white p-3 rounded mt-6 hover:bg-gray-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;