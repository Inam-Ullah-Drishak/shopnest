import { Link, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import UserMenu from './UserMenu.jsx';

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

  const navClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-sm hover:text-white ${
      isActive ? 'text-white' : 'text-gray-300'
    }`;

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold">
            ShopNest
          </Link>
        </div>

        <nav className="hidden md:flex gap-6 shrink-0">
          <NavLink to="/shop" className={navClass}>
            Shop
          </NavLink>

          <NavLink to="/collections" className={navClass}>
            Collections
          </NavLink>
        </nav>

        <nav className="flex-1 flex gap-5 items-center justify-end">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {itemsCount > 0 && (
              <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                {itemsCount}
              </span>
            )}
          </Link>

          {userInfo ? (
            <UserMenu userInfo={userInfo} onLogout={logoutHandler} />
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"
            >
              <User size={16} />
              Log in
            </Link>
          )}
        </nav>
      </div>

      <nav className="md:hidden flex justify-center gap-6 pb-3 border-t border-gray-800 pt-3">
        <NavLink to="/shop" className={navClass}>
          Shop
        </NavLink>

        <NavLink to="/collections" className={navClass}>
          Collections
        </NavLink>
      </nav>
    </header>
  );
}

export default Header;