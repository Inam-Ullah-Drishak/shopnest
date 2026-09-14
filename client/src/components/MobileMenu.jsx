import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  X,
  Store,
  LayoutGrid,
  Tag,
  Sparkles,
  Heart,
  User,
  Package,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

function MobileMenu({ open, onClose, userInfo, onLogout }) {
  // Stop the page behind the drawer scrolling
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const shopLinks = [
    { to: "/shop", label: "Shop all", icon: Store, end: true },
    { to: "/collections", label: "Collections", icon: LayoutGrid },
    { to: "/shop?onSale=true", label: "On sale", icon: Tag },
    { to: "/shop?sort=newest", label: "New arrivals", icon: Sparkles },
  ];

  const accountLinks = userInfo
    ? [
        { to: "/wishlist", label: "Saved items", icon: Heart },
        { to: "/profile", label: "Profile", icon: User },
        { to: "/myorders", label: "Your orders", icon: Package },
        ...(userInfo.isAdmin
          ? [
              {
                to: "/admin",
                label: "Dashboard",
                icon: LayoutDashboard,
              },
            ]
          : []),
      ]
    : [];

  // Navy text, underline only on hover
  const itemClass =
    "flex items-center gap-3 px-4 py-3 text-sm text-navy rounded-lg hover:underline";

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* Overlay */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 bg-navy/50"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 w-72 max-w-[85%] bg-white text-navy flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <Link
            to="/"
            onClick={onClose}
            className="text-lg font-bold text-navy hover:underline"
          >
            ShopNest
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-navy cursor-pointer hover:underline"
          >
            <X size={18} className="text-navy" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {/* Browse */}
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-navy/60 uppercase tracking-wide">
            Browse
          </p>

          {shopLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `${itemClass} ${isActive ? "font-semibold underline" : ""}`
              }
            >
              <Icon size={17} className="text-navy" />

              <span>{label}</span>
            </NavLink>
          ))}

          {/* Account */}
          {userInfo && (
            <>
              <p className="px-4 pt-5 pb-1 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                Account
              </p>

              {accountLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${itemClass} ${
                      isActive ? "font-semibold underline" : ""
                    }`
                  }
                >
                  <Icon size={17} className="text-navy" />

                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 p-2">
          {userInfo ? (
            <>
              {/* User Info */}
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-navy truncate">
                  {userInfo.name}
                </p>

                <p className="text-xs text-navy/60 truncate">
                  {userInfo.email}
                </p>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 rounded-lg hover:underline cursor-pointer"
              >
                <LogOut size={17} className="text-red-500" />

                <span>Log out</span>
              </button>
            </>
          ) : (
            /* Login */
            <Link
              to="/login"
              onClick={onClose}
              className="block text-center bg-teal text-white px-4 py-3 rounded-lg hover:bg-teal-dark font-medium"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;