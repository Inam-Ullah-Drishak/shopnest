import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  ImageOff,
  Loader2,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import { formatPrice } from '../../utils/format.js';

function ProductListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/products', {
          params: { pageNumber: page },
        });

        setProducts(data.products);
        setPages(data.pages);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userInfo, navigate, page]);

  const deleteHandler = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);
    setError('');

    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Products</h1>

        <Link
          to="/admin/product/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
        >
          <Plus size={18} />
          New product
        </Link>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading products
        </div>
      ) : products.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <PackageOpen size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No products yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Add your first product to start selling.
          </p>
          <Link
            to="/admin/product/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            <Plus size={18} />
            New product
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageOff size={16} className="text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          {product.images?.length > 1 && (
                            <p className="text-xs text-gray-500">
                              {product.images.length} photos
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-gray-600">{product.category}</td>
                    <td className="p-3">{formatPrice(product.price)}</td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          product.countInStock === 0
                            ? 'bg-red-100 text-red-700'
                            : product.countInStock < 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {product.countInStock === 0
                          ? 'Out of stock'
                          : `${product.countInStock} left`}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Link
                          to={`/admin/product/${product._id}/edit`}
                          title="Edit"
                          className="p-2 rounded hover:bg-gray-200 text-gray-600"
                        >
                          <Pencil size={16} />
                        </Link>

                        <button
                          onClick={() =>
                            deleteHandler(product._id, product.name)
                          }
                          disabled={deletingId === product._id}
                          title="Delete"
                          className="p-2 rounded hover:bg-red-100 text-red-600 disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === product._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(pages).keys()].map((x) => (
                <button
                  key={x + 1}
                  onClick={() => setPage(x + 1)}
                  className={`px-4 py-2 rounded-lg cursor-pointer ${
                    page === x + 1
                      ? 'bg-gray-900 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {x + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductListPage;