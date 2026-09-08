import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SHIPPING_PRICE = 200;
const FREE_SHIPPING_OVER = 5000;

function PlaceOrderPage() {
  const { cartItems, shippingAddress, totalPrice, clearCart } = useCart();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

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

  const shippingPrice = totalPrice > FREE_SHIPPING_OVER ? 0 : SHIPPING_PRICE;
  const grandTotal = totalPrice + shippingPrice;

  const placeOrderHandler = async () => {
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/orders', {
        orderItems: cartItems.map((item) => ({
          _id: item._id,
          name: item.name,
          qty: item.qty,
        })),
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
      });

      clearCart();
      navigate(`/order/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  if (!shippingAddress || cartItems.length === 0) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Review Order</h1>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded p-4">
            <h2 className="font-bold mb-2">Shipping</h2>
            <p className="text-gray-600">
              {shippingAddress.address}, {shippingAddress.city},{' '}
              {shippingAddress.postalCode}, {shippingAddress.country}
            </p>
            <p className="text-gray-600">Phone: {shippingAddress.phone}</p>
            <Link to="/shipping" className="text-blue-600 underline text-sm">
              Edit
            </Link>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-bold mb-2">Payment Method</h2>
            <p className="text-gray-600">Cash on Delivery</p>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-bold mb-4">Items</h2>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <Link
                    to={`/product/${item._id}`}
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
            <span>Rs {totalPrice}</span>
          </div>

          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>{shippingPrice === 0 ? 'Free' : `Rs ${shippingPrice}`}</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total</span>
            <span>Rs {grandTotal}</span>
          </div>

          <button
            onClick={placeOrderHandler}
            disabled={loading}
            className="w-full bg-gray-900 text-white p-3 rounded mt-6 hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Placing order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrderPage;