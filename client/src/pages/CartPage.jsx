import { Link, useNavigate } from 'react-router-dom';
import { ImageOff, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import QuantityInput from '../components/QuantityInput.jsx';
import { formatPrice } from '../utils/format.js';

function CartPage() {
  const { cartItems, updateQty, removeFromCart, totalPrice } = useCart();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const checkoutHandler = () => {
    navigate(userInfo ? '/shipping' : '/login');
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Your cart</h1>

        <div className="border rounded-lg py-16 text-center">
          <ShoppingBag size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">Your cart is empty</p>
          <p className="text-sm text-gray-500 mt-1">
            Browse the store and add something you like.
          </p>
          <Link
            to="/"
            className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-4 border rounded-lg p-4"
            >
              <div className="w-16 h-16 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff size={18} className="text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item._id}`}
                  className="font-medium hover:underline block truncate"
                >
                  {item.name}
                </Link>

                {item.variantLabel && (
                  <p className="text-xs text-gray-500">{item.variantLabel}</p>
                )}

                <p className="text-gray-600 text-sm">
                  {formatPrice(item.price)}
                </p>
              </div>

              <QuantityInput
                value={item.qty}
                onChange={(qty) => updateQty(item.key, qty)}
                max={Math.max(item.countInStock, item.qty)}
              />

              <button
                onClick={() => removeFromCart(item.key)}
                title="Remove"
                className="p-2 rounded hover:bg-red-100 text-red-600 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-6 h-fit">
          <h2 className="font-bold mb-4">Summary</h2>

          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Items</span>
            <span>{cartItems.reduce((sum, i) => sum + Number(i.qty || 0), 0)}</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <button
            onClick={checkoutHandler}
            className="w-full bg-gray-900 text-white p-3 rounded-lg mt-6 hover:bg-gray-700 cursor-pointer"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;