import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, X, Loader2, PackageOpen } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import Dropdown from '../components/Dropdown.jsx';
import Pagination from '../components/Pagination.jsx';

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || 'All';
  const stock = searchParams.get('stock') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(keyword);
  const [lastKeyword, setLastKeyword] = useState(keyword);

  // Keep the text box in step with the URL (back button, cleared filters).
  // Adjusting during render is React's recommended alternative to an effect.
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

  const filtersActive =
    keyword || category !== 'All' || stock !== 'all' || sort !== 'newest';

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
          params: { keyword, category, stock, sort, pageNumber: page },
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

  // Paging shouldn't leave you scrolled at the bottom of the previous page
  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => setSearchParams({});

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-5">Shop all</h1>

      <div className="flex flex-wrap gap-2 mb-4">
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
            { value: 'all', label: 'Show everything' },
            { value: 'available', label: 'In stock only' },
          ]}
          className="w-44"
        />

        <Dropdown
          value={sort}
          onChange={(v) => setParam({ sort: v })}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'name-asc', label: 'Name A–Z' },
            { value: 'name-desc', label: 'Name Z–A' },
            { value: 'price-asc', label: 'Price low to high' },
            { value: 'price-desc', label: 'Price high to low' },
          ]}
          className="w-48"
          align="right"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading' : `${count} product${count === 1 ? '' : 's'}`}
        </p>

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6 text-sm">
          {error}
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
          <p className="mt-3 font-medium">Nothing matches</p>
          <p className="text-sm text-gray-500 mt-1">
            Try a different search or clear the filters.
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 mt-5 cursor-pointer"
            >
              <X size={16} />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}
    </div>
  );
}

export default ShopPage;