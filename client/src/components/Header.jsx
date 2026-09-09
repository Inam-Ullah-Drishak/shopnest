import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function Header() {
  const { userInfo, logout } = useAuth();
  const { itemsCount, clearCart } = useCart();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      await axios.post('/api/users/logout');
    } catch (error) {
      console.error(error.message);
    }

    logout();
    clearCart();
    navigate('/login');
  };

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          ShopNest
        </Link>

        <nav className="flex gap-6 items-center">
          {userInfo?.isAdmin && (
            <Link to="/admin/products" className="hover:text-gray-300">
              Admin
            </Link>
          )}

          <Link to="/cart" className="hover:text-gray-300">
            Cart
            {itemsCount > 0 && (
              <span className="ml-2 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                {itemsCount}
              </span>
            )}
          </Link>

          {userInfo ? (
            <>
              <Link to="/profile" className="text-gray-300 hover:text-white">
                {userInfo.name}
              </Link>
              <button
                onClick={logoutHandler}
                className="hover:text-gray-300 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-gray-300">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;