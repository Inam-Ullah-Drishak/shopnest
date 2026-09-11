import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {ImageOff,Loader2,MapPin,Wallet,Truck,Copy,Check,AlertCircle,XCircle,} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import OrderStatus, { STATUS_META, FLOW } from '../components/OrderStatus.jsx';
import OrderAdminPanel from '../components/admin/OrderAdminPanel.jsx';
import { formatPrice, formatDate } from '../utils/format.js';
import { usePageTitle } from "../hooks/usePageTitle.js";

function Timeline({ order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
        <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800">Order cancelled</p>
          <p className="text-sm text-red-700 mt-0.5">
            {order.cancelReason || 'This order was cancelled.'}
          </p>
          {order.cancelledAt && (
            <p className="text-xs text-red-600 mt-1">
              {formatDate(order.cancelledAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(order.status);

  // When each stage happened, from the recorded history
  const times = {};
  order.statusHistory?.forEach((h) => {
    times[h.status] = h.at;
  });

  return (
    <div className="border rounded-lg p-5">
      <div className="flex">
        {FLOW.map((step, i) => {
          const meta = STATUS_META[step];
          const done = i <= currentIndex;
          const Icon = meta.icon;

          return (
            <div key={step} className="flex-1 relative">
              {i > 0 && (
                <span
                  className={`absolute top-4 right-1/2 w-full h-0.5 ${
                    i <= currentIndex ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                />
              )}

              <div className="relative flex flex-col items-center text-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon size={15} />
                </span>

                <p
                  className={`text-xs mt-2 ${
                    done ? 'font-medium' : 'text-gray-400'
                  }`}
                >
                  {meta.customerLabel}
                </p>

                {times[step] && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatDate(times[step])}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 text-center mt-5">
        {STATUS_META[order.status].description}
      </p>
    </div>
  );
}

function OrderPage() {
  const { id } = useParams();
  const { userInfo } = useAuth();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  usePageTitle('Your order');
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

  const cancelHandler = async () => {
    const reason = window.prompt(
      'Why are you cancelling? (optional)',
      'Changed my mind'
    );

    if (reason === null) return;

    setCancelling(true);
    setError('');

    try {
      const { data } = await axios.put(`/api/orders/${id}/cancel`, { reason });
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this order');
    } finally {
      setCancelling(false);
    }
  };

  const copyTracking = async () => {
    await navigator.clipboard.writeText(order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading order
      </div>
    );
  }

  if (error && !order) return <p className="p-8 text-red-600">{error}</p>;
  if (!order) return null;

  const isOwner = order.user?._id === userInfo?._id;
  const canCancel = isOwner && ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          {userInfo?.isAdmin && !isOwner ? 'Order' : 'Your order'}
        </h1>
        <OrderStatus status={order.status} size="lg" customer />
      </div>

      <p className="text-gray-500 text-sm mt-1 mb-6">
        {order._id} · placed {formatDate(order.createdAt)}
        {userInfo?.isAdmin && order.user?.name && ` · ${order.user.name}`}
      </p>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {userInfo?.isAdmin && (
        <div className="mb-6">
          <OrderAdminPanel order={order} onChange={setOrder} />
        </div>
      )}

      <div className="mb-6">
        <Timeline order={order} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {order.trackingNumber && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-gray-500" />
                <h2 className="font-bold">Tracking</h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {order.trackingNumber}
                </span>

                <button
                  type="button"
                  onClick={copyTracking}
                  title="Copy"
                  className="p-1.5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                >
                  {copied ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {order.courier && (
                <p className="text-xs text-gray-500 mt-1">
                  Sent with {order.courier}
                </p>
              )}
            </div>
          )}

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
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-gray-500" />
              <h2 className="font-bold">Payment</h2>
            </div>

            <p className="text-gray-600 text-sm">{order.paymentMethod}</p>

            <p className="text-sm mt-2">
              {order.isRefunded ? (
                <span className="text-blue-700">Refunded</span>
              ) : order.isPaid ? (
                <span className="text-green-700">
                  Paid {order.paidAt && formatDate(order.paidAt)}
                </span>
              ) : (
                <span className="text-gray-600">Payment on delivery</span>
              )}
            </p>
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

          {order.discountAmount > 0 && (
            <div className="flex justify-between mb-2 text-sm text-green-700">
              <span>
                Discount{order.couponCode && ` (${order.couponCode})`}
              </span>
              <span>− {formatPrice(order.discountAmount)}</span>
            </div>
          )}

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

          {canCancel && (
            <button
              type="button"
              onClick={cancelHandler}
              disabled={cancelling}
              className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 p-3 rounded-lg mt-6 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
            >
              {cancelling && <Loader2 size={16} className="animate-spin" />}
              Cancel order
            </button>
          )}

          {isOwner && !canCancel && order.status !== 'cancelled' && (
            <p className="text-xs text-gray-500 mt-4">
              This order is already{' '}
              {STATUS_META[order.status].label.toLowerCase()} and can no longer
              be cancelled. Get in touch if something is wrong.
            </p>
          )}

          <Link
            to="/shop"
            className="block text-center w-full border p-3 rounded-lg mt-3 hover:bg-gray-50"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;