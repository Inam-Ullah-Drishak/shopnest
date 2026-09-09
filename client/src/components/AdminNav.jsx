import { NavLink } from 'react-router-dom';
import { Package, Tags, LayoutGrid, Receipt } from 'lucide-react';

const links = [
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/collections', label: 'Collections', icon: LayoutGrid },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
];

function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
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