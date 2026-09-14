import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format.js";

function HeroBanner({ hero }) {
  return (
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
            className="bg-navy text-white px-6 py-3 rounded-lg hover:bg-navy-dark"
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
        <Link
          to={`/product/${hero._id}`}
          className="group block"
        >
          <div className="aspect-4/5 bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={hero.image}
              alt={hero.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          </div>

          <div className="flex items-baseline justify-between mt-3 gap-3">
            <p className="font-medium truncate">
              {hero.name}
            </p>

            <p className="text-gray-600 shrink-0">
              {formatPrice(hero.price)}
            </p>
          </div>
        </Link>
      )}
    </section>
  );
}

export default HeroBanner;