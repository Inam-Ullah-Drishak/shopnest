/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
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
  Eye,
  Upload,
  Download,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import Pagination from '../../components/Pagination.jsx';
import ProductImportModal from '../../components/admin/ProductImportModal.jsx';
import { formatPrice } from '../../utils/format.js';
import { PAGE_SIZE } from '../../utils/constants.js';
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";

function ProductListPage() {
  const toast = useToast();
  const confirm = useConfirm();
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

  usePageTitle('Products');

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

  // Selection is a Set of ids, so the lookup on every row is O(1)
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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

  const fetchProducts = useCallback(async () => {
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
  }, [keyword, category, stock, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageIds = products.map((p) => p._id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const runBulk = async (action) => {
    const ids = [...selected];

    const wording = {
      delete: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
      draft: `Hide ${ids.length} product${ids.length === 1 ? '' : 's'} from the store?`,
      activate: `Make ${ids.length} product${ids.length === 1 ? '' : 's'} visible in the store?`,
    };

    const ok = await confirm({
      title: wording[action],
      message:
        action === "delete" ? "This cannot be undone." : undefined,
      confirmLabel:
        action === "delete"
          ? "Delete"
          : action === "draft"
          ? "Hide them"
          : "Make active",
      danger: action === "delete",
    });

    if (!ok) return;

    setBulkBusy(true);
    setError('');

    try {
      await axios.post('/api/products/bulk', { ids, action });

      if (action === 'delete') {
        setProducts((prev) => prev.filter((p) => !selected.has(p._id)));
        setCount((c) => c - ids.length);
      } else {
        const status = action === 'draft' ? 'draft' : 'active';
        setProducts((prev) =>
          prev.map((p) => (selected.has(p._id) ? { ...p, status } : p))
        );
      }

      clearSelection();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete that action');
    } finally {
      setBulkBusy(false);
    }
  };

  // Export respects the selection, or falls back to the active filters
  const exportUrl = selected.size
    ? `/api/products/export?ids=${[...selected].join(',')}`
    : `/api/products/export?${new URLSearchParams(
        Object.entries({ keyword, category, stock }).filter(
          ([, v]) => v && v !== 'All' && v !== 'all'
        )
      )}`;

  const deleteHandler = async (id, name) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });

    if (!ok) return;

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

        <div className="flex flex-wrap gap-2">
          <a
            href="/api/products/template"
            className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50"
          >
            <FileText size={18} />
            Template
          </a>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <Upload size={18} />
            Import
          </button>

          <Link
            to="/admin/product/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
          >
            <Plus size={18} />
            New product
          </Link>
        </div>
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
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
            { value: 'price-asc', label: 'Price low to high' },
            { value: 'price-desc', label: 'Price high to low' },
            { value: 'stock-asc', label: 'Stock low to high' },
            { value: 'stock-desc', label: 'Stock high to low' },
          ]}
          className="w-48"
        />

        <a
          href={exportUrl}
          className="inline-flex items-center gap-1.5 border rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50"
        >
          <Download size={15} />
          Export
          {selected.size > 0 && ` (${selected.size})`}
        </a>

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

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-gray-900 text-white rounded-lg px-4 py-3 mb-4">
          <p className="text-sm font-medium">
            {selected.size} selected
          </p>

          <div className="flex flex-wrap gap-2 ml-auto">
            <a
              href={`/api/products/export?ids=${[...selected].join(',')}`}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm"
            >
              <Download size={14} />
              Export
            </a>

            <button
              type="button"
              onClick={() => runBulk('activate')}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm disabled:opacity-50 cursor-pointer"
            >
              <Eye size={14} />
              Make active
            </button>

            <button
              type="button"
              onClick={() => runBulk('draft')}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm disabled:opacity-50 cursor-pointer"
            >
              <EyeOff size={14} />
              Make draft
            </button>

            <button
              type="button"
              onClick={() => runBulk('delete')}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-sm disabled:opacity-50 cursor-pointer"
            >
              {bulkBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1.5 hover:bg-white/10 px-3 py-1.5 rounded text-sm cursor-pointer"
            >
              <X size={14} />
              Clear
            </button>
          </div>
        </div>
      )}

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
                Add your first product, or import a spreadsheet.
              </p>
              <div className="flex gap-2 justify-center mt-5">
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <Upload size={18} />
                  Import
                </button>

                <Link
                  to="/admin/product/new"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
                >
                  <Plus size={18} />
                  New product
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      aria-label="Select all on this page"
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const isSelected = selected.has(product._id);

                  return (
                    <tr
                      key={product._id}
                      className={`border-t ${
                        isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(product._id)}
                          aria-label={`Select ${product.name}`}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>

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
                          ? `${formatPrice(product.minPrice)} - ${formatPrice(
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
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={fetchProducts}
      />
    </div>
  );
}

export default ProductListPage;