import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import ImageGallery from '../components/ImageGallery.jsx';
import VariantSelector from '../components/VariantSelector.jsx';
import { formatPrice } from '../utils/format.js';

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
        setQty(1);

        // Preselect the first in-stock variant so the page opens ready to buy
        if (data.variants?.length) {
          const first =
            data.variants.find((v) => v.countInStock > 0) || data.variants[0];

          const initial = {};
          first.options.forEach((o) => {
            initial[o.name] = o.value;
          });
          setSelected(initial);
        } else {
          setSelected({});
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const hasVariants = product?.variants?.length > 0;

  // The variant matching every currently selected option
  const activeVariant = useMemo(() => {
    if (!hasVariants) return null;

    return (
      product.variants.find((variant) =>
        variant.options.every((o) => selected[o.name] === o.value)
      ) || null
    );
  }, [product, selected, hasVariants]);

  const selectHandler = (name, value) => {
    setSelected((prev) => ({ ...prev, [name]: value }));
    setQty(1);
  };

  const price = hasVariants ? activeVariant?.price : product?.price;
  const stock = hasVariants
    ? activeVariant?.countInStock ?? 0
    : product?.countInStock ?? 0;

  const inStock = stock > 0;
  const canBuy = hasVariants ? Boolean(activeVariant) && inStock : inStock;

  const addToCartHandler = () => {
    addToCart(product, qty, activeVariant);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading
      </div>
    );
  }

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!product) return null;

  // Variant image takes priority, falling back to the product gallery
  const galleryImages =
    activeVariant?.image && !product.images.includes(activeVariant.image)
      ? [activeVariant.image, ...product.images]
      : product.images;

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        All products
      </Link>

      <div className="grid md:grid-cols-2 gap-10 mt-6">
        <ImageGallery images={galleryImages} alt={product.name} />

        <div>
          <p className="text-sm text-gray-500">{product.category}</p>
          <h1 className="text-3xl font-bold mt-1">{product.name}</h1>

          <p className="text-2xl font-semibold mt-4">
            {price != null ? formatPrice(price) : 'Select an option'}
          </p>

          {hasVariants && product.minPrice !== product.maxPrice && (
            <p className="text-sm text-gray-500 mt-1">
              {formatPrice(product.minPrice)} – {formatPrice(product.maxPrice)}{' '}
              depending on {product.optionTypes[0]?.name.toLowerCase()}
            </p>
          )}

          <p className="text-gray-600 mt-4 leading-relaxed">
            {product.description}
          </p>

          {hasVariants && (
            <div className="mt-6">
              <VariantSelector
                optionTypes={product.optionTypes}
                variants={product.variants}
                selected={selected}
                onSelect={selectHandler}
              />
            </div>
          )}

          <p className="mt-6 text-sm">
            {inStock ? (
              <span className="text-green-700">
                In stock · {stock} available
              </span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          {activeVariant?.sku && (
            <p className="text-xs text-gray-400 mt-1">
              SKU {activeVariant.sku}
            </p>
          )}

          {inStock && (
            <div className="mt-4">
              <label htmlFor="qty" className="block mb-1 font-medium text-sm">
                Quantity
              </label>
              <select
                id="qty"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="border rounded-lg p-2.5 w-24"
              >
                {[...Array(stock).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={addToCartHandler}
            disabled={!canBuy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white p-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingCart size={18} />
            {canBuy ? 'Add to cart' : 'Out of stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;