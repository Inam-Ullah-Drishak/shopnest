import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ImageOff, AlertCircle, Loader2, MapPin, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import CouponInput from '../components/CouponInput.jsx';
import { formatPrice } from '../utils/format.js';

const SHIPPING_PRICE = 200;
const FREE_SHIPPING_OVER = 5000;

function PlaceOrderPage() {
  const { cartItems, shippingAddress, totalPrice, clearCart } = useCart();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState(null);
  const [lastSubtotal, setLastSubtotal] = useState(totalPrice);

  // A coupon checked against an older subtotal may no longer be valid,
  // so drop it whenever the cart total changes. Adjusting during render is
  // React's recommended alternative to an effect.
  if (totalPrice !== lastSubtotal) {
    setLastSubtotal(totalPrice);
    setCoupon(null);
  }

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else if (!shippingAddress) {
      navigate('/shipping');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [userInfo, shippingAddress, cartItems, navigate]);

  const discount = coupon?.discount || 0;
  const discountedSubtotal = totalPrice - discount;

  const shippingPrice =
    discountedSubtotal > FREE_SHIPPING_OVER ? 0 : SHIPPING_PRICE;

  const grandTotal = discountedSubtotal + shippingPrice;

  const placeOrderHandler = async () => {
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/orders', {
        orderItems: cartItems.map((item) => ({
          _id: item._id,
          variantId: item.variantId,
          qty: Number(item.qty) || 1,
        })),
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
        couponCode: coupon?.code || '',
      });

      clearCart();
      navigate(`/order/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place your order');
      setLoading(false);
    }
  };

  if (!shippingAddress || cartItems.length === 0) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Review your order</h1>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-gray-500" />
              <h2 className="font-bold">Delivering to</h2>
            </div>

            <p className="text-gray-600 text-sm">
              {shippingAddress.address}, {shippingAddress.city},{' '}
              {shippingAddress.postalCode}, {shippingAddress.country}
            </p>
            <p className="text-gray-600 text-sm">
              Phone {shippingAddress.phone}
            </p>

            <Link
              to="/shipping"
              className="text-blue-600 hover:underline text-sm inline-block mt-2"
            >
              Change address
            </Link>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-gray-500" />
              <h2 className="font-bold">Payment</h2>
            </div>
            <p className="text-gray-600 text-sm">Cash on delivery</p>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-bold mb-4">
              {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
            </h2>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
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
                      to={`/product/${item._id}`}
                      className="text-sm hover:underline block truncate"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="text-xs text-gray-500">
                        {item.variantLabel}
                      </p>
                    )}
                  </div>

                  <span className="text-sm text-gray-600 shrink-0">
                    {Number(item.qty) || 0} × {formatPrice(item.price)}
                  </span>

                  <span className="text-sm font-medium shrink-0 w-28 text-right">
                    {formatPrice(item.price * (Number(item.qty) || 0))}
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
            <span>{formatPrice(totalPrice)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between mb-2 text-sm text-green-700">
              <span>Discount ({coupon.code})</span>
              <span>− {formatPrice(discount)}</span>
            </div>
          )}

          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Shipping</span>
            <span>
              {shippingPrice === 0 ? 'Free' : formatPrice(shippingPrice)}
            </span>
          </div>

          <div className="border-t pt-3 mt-3 mb-4">
            <CouponInput
              subtotal={totalPrice}
              applied={coupon}
              onApply={setCoupon}
              onRemove={() => setCoupon(null)}
            />
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-3">
            <span>Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>

          {shippingPrice > 0 && discountedSubtotal < FREE_SHIPPING_OVER && (
            <p className="text-xs text-gray-500 mt-2">
              Spend {formatPrice(FREE_SHIPPING_OVER - discountedSubtotal + 1)}{' '}
              more for free delivery.
            </p>
          )}

          <button
            onClick={placeOrderHandler}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white p-3 rounded-lg mt-6 hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Place order
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrderPage;