import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Truck, Wallet, RotateCcw, ImageOff } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { formatPrice } from '../utils/format.js';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, collectionRes] = await Promise.all([
          axios.get('/api/products', {
            params: { sort: 'newest', pageSize: 60 },
          }),
          axios.get('/api/collections', { params: { published: 'true' } }),
        ]);

        setProducts(productRes.data.products);
        setCollections(collectionRes.data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading
      </div>
    );
  }

  const inStock = products.filter((p) => p.countInStock > 0 && p.image);
  const hero = inStock[0];
  const arrivals = products.slice(0, 6);

  // One representative photo per category, taken from the products we already have
  const categories = [];
  const seen = new Set();

  for (const product of products) {
    if (!product.category || seen.has(product.category)) continue;
    seen.add(product.category);
    categories.push({ name: product.category, image: product.image });
  }

  return (
    <div>
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-8 items-center px-8 py-12 md:py-20">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Things worth
            <br />
            keeping.
          </h1>

          <p className="text-gray-600 mt-5 max-w-md leading-relaxed">
            Clothing, jewellery and pieces for the home. Chosen carefully,
            priced honestly, delivered across Pakistan.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/shop"
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Shop everything
            </Link>

            <Link
              to="/collections"
              className="border px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Browse collections
            </Link>
          </div>
        </div>

        {hero && (
          <Link to={`/product/${hero._id}`} className="group block">
            <div className="aspect-4/5 bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={hero.image}
                alt={hero.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <p className="font-medium">{hero.name}</p>
              <p className="text-gray-600">{formatPrice(hero.price)}</p>
            </div>
          </Link>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="px-8 py-10 border-t">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold">Shop by category</h2>
            <Link
              to="/shop"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <ImageOff size={20} className="text-gray-300" />
                  )}
                </div>

                <p className="text-sm font-medium mt-2 text-center">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="px-8 py-10 border-t">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold">Collections</h2>
            <Link
              to="/collections"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              See all
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {collections.slice(0, 3).map((collection) => (
              <Link
                key={collection._id}
                to={`/collection/${collection.slug}`}
                className="group"
              >
                <div className="aspect-3/2 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <ImageOff size={24} className="text-gray-300" />
                  )}
                </div>

                <h3 className="font-medium mt-3">{collection.title}</h3>

                {collection.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="px-8 py-10 border-t">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold">Just arrived</h2>
            <Link
              to="/shop?sort=newest"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {arrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Service promises */}
      <section className="px-8 py-12 border-t">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <Truck size={20} className="text-gray-400" />
            <p className="font-medium mt-3">Free delivery over Rs 5,000</p>
            <p className="text-sm text-gray-500 mt-1">
              Flat Rs 200 on everything below that.
            </p>
          </div>

          <div>
            <Wallet size={20} className="text-gray-400" />
            <p className="font-medium mt-3">Pay when it arrives</p>
            <p className="text-sm text-gray-500 mt-1">
              Cash on delivery, nationwide.
            </p>
          </div>

          <div>
            <RotateCcw size={20} className="text-gray-400" />
            <p className="font-medium mt-3">Seven day returns</p>
            <p className="text-sm text-gray-500 mt-1">
              Unworn and unused, no questions asked.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;