import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, LayoutGrid, ImageOff } from 'lucide-react';

function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data } = await axios.get('/api/collections', {
          params: { published: 'true' },
        });
        setCollections(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading collections
      </div>
    );
  }

  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Collections</h1>
      <p className="text-gray-600 mb-6">
        Curated groups of products, picked by hand.
      </p>

      {collections.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <LayoutGrid size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No collections yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Check back soon, or browse everything in the store.
          </p>
          <Link
            to="/"
            className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection._id}
              to={`/collection/${collection.slug}`}
              className="group border rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-3/2 bg-gray-50 flex items-center justify-center overflow-hidden">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <ImageOff size={28} className="text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <h2 className="font-medium">{collection.title}</h2>

                {collection.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {collection.productCount ?? collection.products?.length ?? 0}{' '}
                  products
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollectionsPage;