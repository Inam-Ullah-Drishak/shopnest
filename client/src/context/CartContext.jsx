import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// A cart line is identified by product + variant, so the same product in two
// sizes occupies two separate lines.
const lineKey = (productId, variantId) =>
  variantId ? `${productId}::${variantId}` : productId;

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem('cartItems');
    return stored ? JSON.parse(stored) : [];
  });

  const [shippingAddress, setShippingAddressState] = useState(() => {
    const stored = localStorage.getItem('shippingAddress');
    return stored ? JSON.parse(stored) : null;
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