import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import Carousel from "./Carousel.jsx";

function CategoryCarousel({ categories = [] }) {
  // Top level only, and honour the admin's active toggle -- /api/categories
  // returns every category because the admin screens need them all
  const topCategories = categories.filter(
    (c) => !c.parent && c.isActive !== false,
  );

  if (topCategories.length === 0) {
    return null;
  }

  return (
    <section className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-2xl font-bold">Shop by category</h2>

        <Link to="/shop" className="text-sm text-gray-600 hover:underline">
          See all
        </Link>
      </div>

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
  );
}

export default CategoryCarousel;