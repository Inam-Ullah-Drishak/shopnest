import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import ImageGallery from '../components/ImageGallery.jsx';
import VariantSelector from '../components/VariantSelector.jsx';
import QuantityInput from '../components/QuantityInput.jsx';
import StarRating from '../components/StarRating.jsx';
import ProductReviews from '../components/ProductReviews.jsx';
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
      setError('');
      window.scrollTo({ top: 0 });

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

  const compareAt = hasVariants
    ? activeVariant?.compareAtPrice
    : product?.compareAtPrice;

  const onSale = Boolean(compareAt && price && compareAt > price);
  const discount = onSale
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;

  const stock = hasVariants
    ? activeVariant?.countInStock ?? 0
    : product?.countInStock ?? 0;

  const inStock = stock > 0;
  const canBuy = hasVariants ? Boolean(activeVariant) && inStock : inStock;

  const addToCartHandler = () => {
    addToCart(product, Number(qty) || 1, activeVariant);
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

  const categoryName = product.categoryName || product.category?.name || '';

  const galleryImages =
    activeVariant?.image && !product.images.includes(activeVariant.image)
      ? [activeVariant.image, ...product.images]
      : product.images;

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1 hover:text-gray-900"
        >
          <ArrowLeft size={15} />
          Shop
        </Link>

        {categoryName && (
          <>
            <span>/</span>
            <Link
              to={`/shop?category=${encodeURIComponent(categoryName)}`}
              className="hover:text-gray-900"
            >
              {categoryName}
            </Link>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-10 mt-6">
        <ImageGallery images={galleryImages} alt={product.name} />

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {product.numReviews > 0 && (
            <div className="mt-2">
              <StarRating
                value={product.rating}
                count={product.numReviews}
                size={16}
              />
            </div>
          )}

          <div className="flex items-baseline gap-3 mt-4 flex-wrap">
            <p className="text-2xl font-semibold">
              {price != null ? formatPrice(price) : 'Select an option'}
            </p>

            {onSale && (
              <>
                <p className="text-lg text-gray-400 line-through">
                  {formatPrice(compareAt)}
                </p>
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  {discount}% off
                </span>
              </>
            )}
          </div>

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
              <QuantityInput
                id="qty"
                value={qty}
                onChange={setQty}
                max={stock}
              />
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

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/shop?keyword=${encodeURIComponent(tag)}`}
                  className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductReviews
        productId={product._id}
        rating={product.rating || 0}
        numReviews={product.numReviews || 0}
      />
    </div>
  );
}

export default ProductPage;