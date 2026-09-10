import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  LayoutGrid,
  Ticket,
  Receipt,
  Users,
} from 'lucide-react';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/collections', label: 'Collections', icon: LayoutGrid },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/customers', label: 'Customers', icon: Users },
];

function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AdminNav;