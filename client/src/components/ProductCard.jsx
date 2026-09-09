import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import StarRating from './StarRating.jsx';
import { formatPrice } from '../utils/format.js';

function ProductCard({ product }) {
  const stock = product.totalStock ?? product.countInStock;
  const outOfStock = stock === 0;

  const hasRange = product.hasVariants && product.minPrice !== product.maxPrice;
  const onSale =
    product.compareAtPrice && product.compareAtPrice > product.price;

  const discount = onSale
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

  return (
    <Link
      to={`/product/${product._id}`}
      className="group border rounded-lg overflow-hidden hover:shadow-md transition block"
    >
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <ImageOff size={28} className="text-gray-300" />
        )}

        {outOfStock && (
          <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
            Out of stock
          </span>
        )}

        {!outOfStock && onSale && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            {discount}% off
          </span>
        )}

        {product.images?.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-gray-900/70 text-white text-xs px-2 py-0.5 rounded">
            {product.images.length} photos
          </span>
        )}
      </div>

      <div className="p-4">
        <h2 className="font-medium truncate">{product.name}</h2>
        <p className="text-sm text-gray-500">
          {product.categoryName || product.category}
        </p>

        {product.numReviews > 0 && (
          <div className="mt-1.5">
            <StarRating value={product.rating} count={product.numReviews} />
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          <p className="text-lg font-bold">
            {hasRange
              ? `${formatPrice(product.minPrice)} – ${formatPrice(
                  product.maxPrice
                )}`
              : formatPrice(product.minPrice ?? product.price)}
          </p>

          {onSale && !hasRange && (
            <p className="text-sm text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </p>
          )}
        </div>

        {product.hasVariants && (
          <p className="text-xs text-gray-500 mt-1">
            {product.variants.length}{' '}
            {product.optionTypes[0]?.name.toLowerCase() || 'option'}s
          </p>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;