import { NavLink } from 'react-router-dom';

function AdminNav() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded ${
      isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
    }`;

  return (
    <nav className="flex gap-3 mb-6">
      <NavLink to="/admin/products" className={linkClass}>
        Products
      </NavLink>
      <NavLink to="/admin/orders" className={linkClass}>
        Orders
      </NavLink>
    </nav>
  );
}

export default AdminNav;