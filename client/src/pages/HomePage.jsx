import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard.jsx';

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || 'All';
  const pageNumber = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(keyword);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/products/categories');
        setCategories(data);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get('/api/products', {
          params: { keyword, category, pageNumber },
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
  }, [keyword, category, pageNumber]);

  const searchHandler = (e) => {
    e.preventDefault();
    setSearchParams({ keyword: searchInput, category, page: 1 });
  };

  const categoryHandler = (value) => {
    setSearchParams({ keyword, category: value, page: 1 });
  };

  const pageHandler = (value) => {
    setSearchParams({ keyword, category, page: value });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <form onSubmit={searchHandler} className="flex gap-2 flex-1 min-w-64">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="border rounded p-2 flex-1"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 rounded hover:bg-gray-700 cursor-pointer"
          >
            Search
          </button>
        </form>

        <select
          value={category}
          onChange={(e) => categoryHandler(e.target.value)}
          className="border rounded p-2"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(pages).keys()].map((x) => (
                <button
                  key={x + 1}
                  onClick={() => pageHandler(x + 1)}
                  className={`px-4 py-2 rounded cursor-pointer ${
                    pageNumber === x + 1
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
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

export default HomePage;