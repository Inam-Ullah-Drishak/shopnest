import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, PackageOpen, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import Dropdown from '../components/Dropdown.jsx';
import Pagination from '../components/Pagination.jsx';

function CollectionPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await axios.get(`/api/collections/${slug}`, {
          params: { sort, pageNumber: page },
        });

        setCollection(data.collection);
        setProducts(data.products);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Could not load this collection'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [slug, sort, page]);

  const setParam = (changes) => setSearchParams({ sort, page: 1, ...changes });

  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
        >
          <ArrowLeft size={15} />
          Back to the shop
        </Link>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="p-8">
      {collection.image ? (
        <div className="h-48 md:h-60 rounded-lg overflow-hidden mb-6 relative">
          <img
            src={collection.image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/40 flex items-end p-6">
            <h1 className="text-3xl font-bold text-white">
              {collection.title}
            </h1>
          </div>
        </div>
      ) : (
        <h1 className="text-3xl font-bold mb-2">{collection.title}</h1>
      )}

      {collection.description && (
        <p className="text-gray-600 max-w-2xl leading-relaxed mb-6">
          {collection.description}
        </p>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <p className="text-sm text-gray-500">
          {count} product{count === 1 ? '' : 's'}
        </p>

        {count > 1 && (
          <Dropdown
            value={sort}
            onChange={(v) => setParam({ sort: v })}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'name-asc', label: 'Name A–Z' },
              { value: 'price-asc', label: 'Price low to high' },
              { value: 'price-desc', label: 'Price high to low' },
            ]}
            className="w-48"
            align="right"
          />
        )}
      </div>

      {products.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <PackageOpen size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">Nothing here yet</p>
          <p className="text-sm text-gray-500 mt-1">
            This collection has no products at the moment.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            Browse all products
          </Link>
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

export default CollectionPage;