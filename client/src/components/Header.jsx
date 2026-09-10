import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, User, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import UserMenu from './UserMenu.jsx';
import MobileMenu from './MobileMenu.jsx';

function Header() {
  const { userInfo, logout } = useAuth();
  const { itemsCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

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
    <>
      <header className="bg-gray-900 text-white sticky top-0 z-40">
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

          <nav className="flex-1 flex gap-4 sm:gap-5 items-center justify-end">
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
              {itemsCount > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                  {itemsCount}
                </span>
              )}
            </Link>

            <div className="hidden md:block">
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
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-1 -mr-1 text-gray-300 hover:text-white cursor-pointer"
            >
              <Menu size={22} />
            </button>
          </nav>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userInfo={userInfo}
        onLogout={logoutHandler}
      />
    </>
  );
}

export default Header;