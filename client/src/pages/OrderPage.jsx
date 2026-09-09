import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  MapPin,
  Wallet,
} from 'lucide-react';
import { formatPrice, formatDate } from '../utils/format.js';

function StatusBadge({ done, doneLabel, pendingLabel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ${
        done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {done ? <CheckCircle2 size={14} /> : <Clock size={14} />}
      {done ? doneLabel : pendingLabel}
    </span>
  );
}

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
        setError(err.response?.data?.message || 'Could not load this order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading order
      </div>
    );
  }

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div className="p-8">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={22} className="text-green-600" />
        <h1 className="text-2xl font-bold">Order placed</h1>
      </div>

      <p className="text-gray-500 text-sm mt-1 mb-6">
        Order {order._id} · placed {formatDate(order.createdAt)}
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-gray-500" />
              <h2 className="font-bold">Delivering to</h2>
            </div>

            <p className="text-gray-600 text-sm">
              {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.postalCode},{' '}
              {order.shippingAddress.country}
            </p>
            <p className="text-gray-600 text-sm">
              Phone {order.shippingAddress.phone}
            </p>

            <div className="mt-3">
              <StatusBadge
                done={order.isDelivered}
                doneLabel={
                  order.deliveredAt
                    ? `Delivered ${formatDate(order.deliveredAt)}`
                    : 'Delivered'
                }
                pendingLabel="On the way"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-gray-500" />
              <h2 className="font-bold">Payment</h2>
            </div>

            <p className="text-gray-600 text-sm">{order.paymentMethod}</p>

            <div className="mt-3">
              <StatusBadge
                done={order.isPaid}
                doneLabel="Paid"
                pendingLabel="Payment on delivery"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-bold mb-4">
              {order.orderItems.length} item
              {order.orderItems.length > 1 ? 's' : ''}
            </h2>

            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff size={14} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product}`}
                      className="text-sm hover:underline block truncate"
                    >
                      {item.name}
                    </Link>

                    {item.variantLabel && (
                      <p className="text-xs text-gray-500">
                        {item.variantLabel}
                        {item.sku && ` · SKU ${item.sku}`}
                      </p>
                    )}
                  </div>

                  <span className="text-sm text-gray-600 shrink-0">
                    {item.qty} × {formatPrice(item.price)}
                  </span>

                  <span className="text-sm font-medium shrink-0 w-28 text-right">
                    {formatPrice(item.qty * item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 h-fit">
          <h2 className="font-bold mb-4">Summary</h2>

          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Items</span>
            <span>{formatPrice(order.itemsPrice)}</span>
          </div>

          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Shipping</span>
            <span>
              {order.shippingPrice === 0
                ? 'Free'
                : formatPrice(order.shippingPrice)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
            <span>Total</span>
            <span>{formatPrice(order.totalPrice)}</span>
          </div>

          <Link
            to="/"
            className="block text-center w-full border p-3 rounded-lg mt-6 hover:bg-gray-50"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;