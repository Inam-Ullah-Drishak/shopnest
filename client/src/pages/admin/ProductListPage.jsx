import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  ImageOff,
  Loader2,
  AlertCircle,
  PackageOpen,
  Search,
  X,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import Pagination from '../../components/Pagination.jsx';
import { formatPrice } from '../../utils/format.js';
import { PAGE_SIZE } from '../../utils/constants.js';

function ProductListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || 'All';
  const stock = searchParams.get('stock') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(keyword);
  const [lastKeyword, setLastKeyword] = useState(keyword);

  if (keyword !== lastKeyword) {
    setLastKeyword(keyword);
    setSearchInput(keyword);
  }

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const filtersActive =
    keyword || category !== 'All' || stock !== 'all' || sort !== 'newest';

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    axios
      .get('/api/products/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/products', {
          params: {
            keyword,
            category,
            stock,
            sort,
            includeDrafts: 'true',
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });

        setProducts(data.products);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, category, stock, sort, page]);

  // Merge one change into the URL, resetting to page 1
  const setParam = (changes) => {
    const next = { keyword, category, stock, sort, page: 1, ...changes };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === 'All' || next[k] === 'all') delete next[k];
    });

    setSearchParams(next);
  };

  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => setSearchParams({});

  const deleteHandler = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);
    setError('');

    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setCount((c) => c - 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading' : `${count} product${count === 1 ? '' : 's'}`}
            {filtersActive && !loading && ' matching your filters'}
          </p>
        </div>

        <Link
          to="/admin/product/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
        >
          <Plus size={18} />
          New product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ keyword: searchInput });
          }}
          className="relative flex-1 min-w-56"
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name"
            className="w-full border rounded-lg py-2.5 pl-9 pr-3 text-sm"
          />
        </form>

        <Dropdown
          value={category}
          onChange={(v) => setParam({ category: v })}
          options={[
            { value: 'All', label: 'All categories' },
            ...categories.map((cat) => ({ value: cat, label: cat })),
          ]}
          className="w-44"
        />

        <Dropdown
          value={stock}
          onChange={(v) => setParam({ stock: v })}
          options={[
            { value: 'all', label: 'Any stock' },
            { value: 'in', label: 'In stock' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ]}
          className="w-36"
        />

        <Dropdown
          value={sort}
          onChange={(v) => setParam({ sort: v })}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'name-asc', label: 'Name A–Z' },
            { value: 'name-desc', label: 'Name Z–A' },
            { value: 'price-asc', label: 'Price low to high' },
            { value: 'price-desc', label: 'Price high to low' },
            { value: 'stock-asc', label: 'Stock low to high' },
            { value: 'stock-desc', label: 'Stock high to low' },
          ]}
          className="w-48"
        />

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 border rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
          >
            <X size={15} />
            Clear
          </button>
        )}
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
          {filtersActive ? (
            <>
              <Search size={36} className="mx-auto text-gray-300" />
              <p className="mt-3 font-medium">No products match</p>
              <p className="text-sm text-gray-500 mt-1">
                Try a different search or clear the filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 mt-5 cursor-pointer"
              >
                <X size={16} />
                Clear filters
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageOff size={16} className="text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {product.name}
                            </p>

                            {product.status === 'draft' && (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded shrink-0">
                                <EyeOff size={11} />
                                Draft
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500">
                            {product.hasVariants &&
                              `${product.variants.length} variants`}
                            {product.hasVariants &&
                              product.images?.length > 1 &&
                              ' · '}
                            {product.images?.length > 1 &&
                              `${product.images.length} photos`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-gray-600">
                      {product.categoryName}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {product.hasVariants &&
                      product.minPrice !== product.maxPrice
                        ? `${formatPrice(product.minPrice)} – ${formatPrice(
                            product.maxPrice
                          )}`
                        : formatPrice(product.price)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
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

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}
    </div>
  );
}

export default ProductListPage;