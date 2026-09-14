/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import axios from 'axios';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext();

// A cart line is identified by product + variant, so the same product in two
// sizes occupies two separate lines.
const lineKey = (productId, variantId) =>
  variantId ? `${productId}::${variantId}` : productId;

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cartItems');
      const parsed = stored ? JSON.parse(stored) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem('cartItems');
      return [];
    }
  });

  const [shippingAddress, setShippingAddressState] = useState(() => {
    try {
      const stored = localStorage.getItem('shippingAddress');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('shippingAddress');
      return null;
    }
  });

  const toast = useToast();

  // Read these inside refreshCart without making it a new function on every
  // render, which would restart the effect that calls it. Written in effects
  // rather than during render, which React treats as a side effect.
  const cartRef = useRef(cartItems);

  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  // ToastProvider rebuilds this object every render, so no dependency list
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty, variant = null) => {
    const key = lineKey(product._id, variant?._id);
    const quantity = Number(qty) || 1;

    setCartItems((prev) => {
      const exists = prev.find((item) => item.key === key);

      if (exists) {
        return prev.map((item) =>
          item.key === key ? { ...item, qty: quantity } : item
        );
      }

      return [
        ...prev,
        {
          key,
          _id: product._id,
          variantId: variant?._id || null,
          variantLabel: variant
            ? variant.options.map((o) => o.value).join(' / ')
            : '',
          name: product.name,
          price: variant ? variant.price : product.price,
          image: variant?.image || product.image,
          countInStock: variant ? variant.countInStock : product.countInStock,
          qty: quantity,
        },
      ];
    });
  };

  // Price and stock are copied into the line when it's added and then sit in
  // localStorage indefinitely. A cart left for a week shows last week's prices,
  // while createOrder recalculates from the database -- so the customer could
  // review one total and be charged another. Re-reading the products on the way
  // into the cart and the review page keeps the two honest.
  const refreshCart = useCallback(async () => {
    const items = cartRef.current;

    if (items.length === 0) return;

    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const { data } = await axios.get(`/api/products/${item._id}`);

          const variant = item.variantId
            ? data.variants?.find(
                (v) => String(v._id) === String(item.variantId)
              )
            : null;

          // Hidden since it was added, or the chosen option was removed. Zero
          // stock keeps the line visible but unbuyable, and createOrder gives
          // the precise reason if they push on.
          if (data.status === 'draft' || (item.variantId && !variant)) {
            return { line: { ...item, countInStock: 0 }, priceChanged: false };
          }

          const price = variant ? variant.price : data.price;

          return {
            line: {
              ...item,
              name: data.name,
              price,
              countInStock: variant ? variant.countInStock : data.countInStock,
              image: variant?.image || data.image || item.image,
            },
            priceChanged: price !== item.price,
          };
        } catch {
          // Deleted, or the request failed. Either way don't let it be ordered
          return { line: { ...item, countInStock: 0 }, priceChanged: false };
        }
      })
    );

    const fresh = results.map((r) => r.line);

    // Only write when something actually moved, so we don't churn localStorage
    // or retrigger effects watching the cart
    const changed = fresh.some(
      (line, i) =>
        line.price !== items[i].price ||
        line.countInStock !== items[i].countInStock ||
        line.name !== items[i].name
    );

    if (changed) setCartItems(fresh);

    const repriced = results.filter((r) => r.priceChanged).map((r) => r.line);
    const unavailable = fresh.filter((line) => line.countInStock === 0);

    if (repriced.length === 1) {
      toastRef.current?.info(`${repriced[0].name} has changed price.`);
    } else if (repriced.length > 1) {
      toastRef.current?.info(
        `${repriced.length} items in your cart have changed price.`
      );
    }

    if (unavailable.length === 1) {
      toastRef.current?.error(`${unavailable[0].name} is no longer available.`);
    } else if (unavailable.length > 1) {
      toastRef.current?.error(
        `${unavailable.length} items in your cart are no longer available.`
      );
    }
  }, []);

  const updateQty = (key, qty) => {
    setCartItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, qty } : item))
    );
  };

  const removeFromCart = (key) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const saveShippingAddress = (address) => {
    setShippingAddressState(address);
    localStorage.setItem('shippingAddress', JSON.stringify(address));
  };

  const clearCart = () => {
    setCartItems([]);
    setShippingAddressState(null);
    localStorage.removeItem('shippingAddress');
  };

  // qty can briefly be '' while the user is typing, so coerce it
  const itemsCount = cartItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * (Number(item.qty) || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        shippingAddress,
        addToCart,
        updateQty,
        removeFromCart,
        refreshCart,
        saveShippingAddress,
        clearCart,
        itemsCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}