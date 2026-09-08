import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product._id}`}
      className="border rounded-lg overflow-hidden hover:shadow-lg transition block"
    >
      <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
        No image
      </div>

      <div className="p-4">
        <h2 className="font-semibold truncate">{product.name}</h2>
        <p className="text-sm text-gray-500">{product.category}</p>
        <p className="text-lg font-bold mt-2">Rs {product.price}</p>
      </div>
    </Link>
  );
}

export default ProductCard;