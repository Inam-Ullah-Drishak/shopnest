import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';

function ProductListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products');
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    fetchProducts();
  }, [userInfo, navigate]);

  const createHandler = async () => {
    if (!window.confirm('Create a new sample product?')) return;

    try {
      const { data } = await axios.post('/api/products');
      navigate(`/admin/product/${data._id}/edit`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create product');
    }
  };

  const deleteHandler = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete product');
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={createHandler}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 cursor-pointer"
        >
          Create Product
        </button>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Category</th>
              <th className="p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t">
                <td className="p-3">{product.name}</td>
                <td className="p-3">Rs {product.price}</td>
                <td className="p-3">{product.category}</td>
                <td className="p-3">{product.countInStock}</td>
                <td className="p-3 whitespace-nowrap">
                  <Link
                    to={`/admin/product/${product._id}/edit`}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteHandler(product._id)}
                    className="text-red-600 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductListPage;