import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

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

  const addToCart = (product, qty) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item._id === product._id);

      if (exists) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, qty } : item
        );
      }

      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          countInStock: product.countInStock,
          qty,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
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

  const itemsCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        shippingAddress,
        addToCart,
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