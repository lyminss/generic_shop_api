import { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      setCart(res.data);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartService.addToCart(productId, quantity);
      await fetchCart(); // Always re-fetch to ensure UI is in sync with backend
      return true;
    } catch (err) {
      console.error("Failed to add to cart", err);
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) return;
    try {
      await cartService.updateCart(productId, quantity);
      await fetchCart(); // Always re-fetch to ensure UI is in sync with backend
    } catch (err) {
      console.error("Failed to update cart", err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      fetchCart(); // Re-fetch cart after delete since API returns 204 No Content
    } catch (err) {
      console.error("Failed to remove item", err);
    }
  };

  const clearCart = () => {
    setCart(null); // Local clear, typically called after checkout
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
