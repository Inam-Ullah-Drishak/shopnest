import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Heart,
  Package,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from 'lucide-react';

function UserMenu({ userInfo, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const items = [
    { to: '/wishlist', label: 'Saved items', icon: Heart },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/myorders', label: 'My orders', icon: Package },
  ];

  if (userInfo.isAdmin) {
    items.push({
      to: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    });
  }

  const itemClass =
    'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100';

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white cursor-pointer"
      >
        <User size={16} />
        <span className="max-w-24 truncate">{userInfo.name}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 bg-white text-gray-900 border rounded-lg shadow-lg py-1"
        >
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium truncate">{userInfo.name}</p>
            <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
          </div>

          <div className="py-1">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <Icon size={15} className="text-gray-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={`${itemClass} text-red-600 cursor-pointer`}
            >
              <LogOut size={15} className="text-red-400" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;