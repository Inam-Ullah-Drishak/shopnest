import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { formatPrice } from '../utils/format.js';

function ProductCard({ product }) {
  const stock = product.totalStock ?? product.countInStock;
  const outOfStock = stock === 0;

  const hasRange =
    product.hasVariants && product.minPrice !== product.maxPrice;

  return (
    <Link
      to={`/product/${product._id}`}
      className="border rounded-lg overflow-hidden hover:shadow-md transition block"
    >
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff size={28} className="text-gray-300" />
        )}

        {outOfStock && (
          <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
            Out of stock
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
        <p className="text-sm text-gray-500">{product.category}</p>

        <p className="text-lg font-bold mt-2">
          {hasRange
            ? `${formatPrice(product.minPrice)} – ${formatPrice(
                product.maxPrice
              )}`
            : formatPrice(product.minPrice ?? product.price)}
        </p>

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