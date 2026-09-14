import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Heart,
  Package,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from "lucide-react";

function UserMenu({ userInfo, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const items = [
    {
      to: "/wishlist",
      label: "Saved items",
      icon: Heart,
    },
    {
      to: "/profile",
      label: "Profile",
      icon: User,
    },
    {
      to: "/myorders",
      label: "My orders",
      icon: Package,
    },
  ];

  if (userInfo.isAdmin) {
    items.push({
      to: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    });
  }

  // Navy text, underline only on hover
  const itemClass =
    "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-navy hover:underline";

  return (
    <div ref={wrapperRef} className="relative">
      {/* User Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm text-navy hover:underline cursor-pointer"
      >
        <User size={16} className="text-navy" />

        <span className="max-w-24 truncate">
          {userInfo.name}
        </span>

        <ChevronDown
          size={14}
          className={`text-navy transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 bg-white text-navy border border-gray-200 rounded-lg shadow-lg py-1"
        >
          {/* User Information */}
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-navy truncate">
              {userInfo.name}
            </p>

            <p className="text-xs text-navy/60 truncate">
              {userInfo.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <Icon
                  size={15}
                  className="text-navy"
                />

                {label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:underline cursor-pointer"
            >
              <LogOut
                size={15}
                className="text-red-500"
              />

              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;