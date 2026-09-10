import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  X,
  Store,
  LayoutGrid,
  Tag,
  Sparkles,
  User,
  Package,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';

function MobileMenu({ open, onClose, userInfo, onLogout }) {
  // Stop the page behind the drawer scrolling
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const shopLinks = [
    { to: '/shop', label: 'Shop all', icon: Store, end: true },
    { to: '/collections', label: 'Collections', icon: LayoutGrid },
    { to: '/shop?onSale=true', label: 'On sale', icon: Tag },
    { to: '/shop?sort=newest', label: 'New arrivals', icon: Sparkles },
  ];

  const accountLinks = userInfo
    ? [
        { to: '/profile', label: 'Profile', icon: User },
        { to: '/myorders', label: 'Your orders', icon: Package },
        ...(userInfo.isAdmin
          ? [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
          : []),
      ]
    : [];

  const itemClass =
    'flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 rounded-lg';

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 bg-gray-900/50"
      />

      <div className="absolute inset-y-0 right-0 w-72 max-w-[85%] bg-white flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <p className="px-4 pt-3 pb-1 text-xs font-medium text-gray-400">
            Browse
          </p>

          {shopLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `${itemClass} ${isActive ? 'bg-gray-100 font-medium' : ''}`
              }
            >
              <Icon size={17} className="text-gray-400" />
              {label}
            </NavLink>
          ))}

          {userInfo && (
            <>
              <p className="px-4 pt-5 pb-1 text-xs font-medium text-gray-400">
                Account
              </p>

              {accountLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? 'bg-gray-100 font-medium' : ''}`
                  }
                >
                  <Icon size={17} className="text-gray-400" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="border-t p-2">
          {userInfo ? (
            <>
              <div className="px-4 py-2">
                <p className="text-sm font-medium truncate">{userInfo.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className={`${itemClass} w-full text-red-600 cursor-pointer`}
              >
                <LogOut size={17} className="text-red-400" />
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="block text-center bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
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