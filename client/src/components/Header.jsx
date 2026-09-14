import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  ShoppingCart,
  User,
  Menu,
  Heart,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import UserMenu from "./UserMenu.jsx";
import MobileMenu from "./MobileMenu.jsx";

function Header() {
  const { userInfo, logout } = useAuth();
  const { itemsCount, clearCart } = useCart();
  const { count: savedCount } = useWishlist();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // Mirror the shop page's keyword so the two boxes never disagree, and so
  // the term clears when you navigate away from a search
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";

  const [term, setTerm] = useState(keyword);
  const [lastKeyword, setLastKeyword] = useState(keyword);

  if (keyword !== lastKeyword) {
    setLastKeyword(keyword);
    setTerm(keyword);
  }

  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Opening a box you then have to click into is a wasted tap
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const searchHandler = (e) => {
    e.preventDefault();

    const query = term.trim();

    setSearchOpen(false);
    navigate(query ? `/shop?keyword=${encodeURIComponent(query)}` : "/shop");
  };

  const logoutHandler = async () => {
    try {
      await axios.post("/api/users/logout");
    } catch (error) {
      console.error(error.message);
    }

    logout();
    clearCart();
    navigate("/login");
  };

  // Navy color stays the same, underline only on hover
  const navClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-sm text-navy ${
      isActive ? "font-semibold underline" : "hover:underline"
    }`;

  return (
    <>
      <header className="bg-white text-navy sticky top-0 z-40">
        <div className="max-w-7xl mx-auto p-4 flex items-center gap-4">
          {/* Logo */}
          <div className="flex-1">
            <Link to="/" className="text-xl font-bold text-navy">
              <img
                src="/ShopNest Logo.png"
                alt="ShopNest Logo"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="hidden md:flex gap-6 shrink-0">
            <NavLink to="/shop" className={navClass}>
              Shop
            </NavLink>

            <NavLink to="/collections" className={navClass}>
              Collections
            </NavLink>
          </nav>

          {/* Right Navigation */}
          <nav className="flex-1 flex gap-4 sm:gap-5 items-center justify-end">
            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
              className="inline-flex items-center gap-1.5 text-sm text-navy hover:underline cursor-pointer"
            >
              <Search size={18} className="text-navy" />

              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Wishlist */}
            {userInfo && (
              <Link
                to="/wishlist"
                className="inline-flex items-center gap-1.5 text-sm text-navy hover:underline"
              >
                <Heart size={18} className="text-navy" />

                <span className="hidden sm:inline">Saved</span>

                {savedCount > 0 && (
                  <span className="bg-amber text-navy font-medium text-xs rounded-full px-2 py-0.5 no-underline">
                    {savedCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-sm text-navy hover:underline"
            >
              <ShoppingCart size={18} className="text-navy" />

              <span className="hidden sm:inline">Cart</span>

              {itemsCount > 0 && (
                <span className="bg-teal text-white text-xs rounded-full px-2 py-0.5 no-underline">
                  {itemsCount}
                </span>
              )}
            </Link>

            {/* User / Login */}
            <div className="hidden md:block">
              {userInfo ? (
                <UserMenu userInfo={userInfo} onLogout={logoutHandler} />
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-navy hover:underline"
                >
                  <User size={16} className="text-navy" />
                  Log in
                </Link>
              )}
            </div>

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-1 -mr-1 text-navy cursor-pointer"
            >
              <Menu size={22} className="text-navy" />
            </button>
          </nav>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-200">
            <form
              onSubmit={searchHandler}
              role="search"
              className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  ref={searchRef}
                  type="search"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="w-full border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy"
                />
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-2 rounded-lg text-gray-400 hover:text-navy cursor-pointer"
              >
                <X size={18} />
              </button>
            </form>
          </div>
        )}
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