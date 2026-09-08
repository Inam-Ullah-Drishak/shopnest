import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function CartPage() {
  const { cartItems, addToCart, removeFromCart, totalPrice } = useCart();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const checkoutHandler = () => {
    if (userInfo) {
      navigate('/shipping');
    } else {
      navigate('/login');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Shopping Cart</h1>
        <p className="text-gray-600">
          Your cart is empty.{' '}
          <Link to="/" className="text-blue-600 underline">
            Go shopping
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 border rounded p-4"
            >
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 shrink-0">
                No image
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item._id}`}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-gray-600">Rs {item.price}</p>
              </div>

              <select
                value={item.qty}
                onChange={(e) => addToCart(item, Number(e.target.value))}
                className="border rounded p-2"
              >
                {[...Array(item.countInStock).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </select>

              <button
                onClick={() => removeFromCart(item._id)}
                className="text-red-600 hover:text-red-800 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="border rounded p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Summary</h2>

          <div className="flex justify-between mb-2">
            <span>Items</span>
            <span>{cartItems.reduce((sum, i) => sum + i.qty, 0)}</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total</span>
            <span>Rs {totalPrice}</span>
          </div>

          <button
            onClick={checkoutHandler}
            className="w-full bg-gray-900 text-white p-3 rounded mt-6 hover:bg-gray-700 cursor-pointer"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;