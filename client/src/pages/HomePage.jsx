import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Truck, Wallet, RotateCcw, ImageOff } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import Carousel from '../components/Carousel.jsx';
import { formatPrice } from '../utils/format.js';

function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [onSale, setOnSale] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [newest, sale, cats, cols] = await Promise.all([
          axios.get('/api/products', {
            params: { sort: 'newest', pageSize: 12 },
          }),
          axios.get('/api/products', {
            params: { onSale: 'true', pageSize: 12 },
          }),
          axios.get('/api/categories'),
          axios.get('/api/collections', { params: { published: 'true' } }),
        ]);

        setArrivals(newest.data.products);
        setOnSale(sale.data.products);
        setFeatured(newest.data.products.filter((p) => p.isFeatured));
        setCategories(cats.data);
        setCollections(cols.data);
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

  // Top level only — children show on the category page itself
  const topCategories = categories.filter((c) => !c.parent);

  const hero =
    featured.find((p) => p.image && p.countInStock > 0) ||
    arrivals.find((p) => p.image && p.countInStock > 0);

  const sectionHeading = (title, to, linkLabel = 'See all') => (
    <div className="flex items-baseline justify-between mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Link to={to} className="text-sm text-gray-600 hover:text-gray-900">
        {linkLabel}
      </Link>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-8 items-center px-8 py-12 md:py-20">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Made to be
            <br />
            worn often.
          </h1>

          <p className="text-gray-600 mt-5 max-w-md leading-relaxed">
            Necklaces, bangles and earrings for everyday and for occasions.
            Honest prices, cash on delivery across Pakistan.
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

            <div className="flex items-baseline justify-between mt-3 gap-3">
              <p className="font-medium truncate">{hero.name}</p>
              <p className="text-gray-600 shrink-0">
                {formatPrice(hero.price)}
              </p>
            </div>
          </Link>
        )}
      </section>

      {/* Categories */}
      {topCategories.length > 0 && (
        <section className="px-8 py-10 border-t">
          {sectionHeading('Shop by category', '/shop')}

          <Carousel itemClass="w-36 sm:w-40">
            {topCategories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group block"
              >
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <ImageOff size={20} className="text-gray-300" />
                  )}
                </div>

                <p className="text-sm font-medium mt-2 text-center truncate">
                  {category.name}
                </p>

                {category.productCount > 0 && (
                  <p className="text-xs text-gray-400 text-center">
                    {category.productCount} items
                  </p>
                )}
              </Link>
            ))}
          </Carousel>
        </section>
      )}

      {/* On sale */}
      {onSale.length > 0 && (
        <section className="px-8 py-10 border-t">
          {sectionHeading('On sale', '/shop?onSale=true')}

          <Carousel itemClass="w-56 sm:w-64">
            {onSale.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </Carousel>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="px-8 py-10 border-t">
          {sectionHeading('Collections', '/collections')}

          <Carousel itemClass="w-72 sm:w-80">
            {collections.map((collection) => (
              <Link
                key={collection._id}
                to={`/collection/${collection.slug}`}
                className="group block"
              >
                <div className="aspect-3/2 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <ImageOff size={24} className="text-gray-300" />
                  )}
                </div>

                <h3 className="font-medium mt-3 truncate">
                  {collection.title}
                </h3>

                {collection.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </Link>
            ))}
          </Carousel>
        </section>
      )}

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="px-8 py-10 border-t">
          {sectionHeading('Just arrived', '/shop?sort=newest')}

          <Carousel itemClass="w-56 sm:w-64">
            {arrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </Carousel>
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