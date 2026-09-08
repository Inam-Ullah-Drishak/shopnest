import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext.jsx';

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const addToCartHandler = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  if (loading) return <p className="p-8">Loading...</p>;
  if (!product) return <p className="p-8">Product not found</p>;

  return (
    <div className="p-8">
      <Link to="/" className="text-blue-600 underline">
        Back
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div className="h-80 bg-gray-100 rounded flex items-center justify-center text-gray-400">
          No image
        </div>

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
          <p className="text-gray-600 mt-4">{product.description}</p>
          <p className="text-2xl font-semibold mt-4">Rs {product.price}</p>

          <p className="mt-2">
            {product.countInStock > 0 ? (
              <span className="text-green-600">In Stock ({product.countInStock})</span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </p>

          {product.countInStock > 0 && (
            <div className="mt-4">
              <label className="block mb-1 font-medium">Quantity</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="border rounded p-2 w-24"
              >
                {[...Array(product.countInStock).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={addToCartHandler}
            disabled={product.countInStock === 0}
            className="mt-6 w-full bg-gray-900 text-white p-3 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;