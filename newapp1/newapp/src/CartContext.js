// src/CartContext.js
import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage when app starts
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === item.id);
      if (existingIndex !== -1) {
        // If item exists, increase its quantity
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += item.quantity;
        return updatedCart;
      } else {
        // If new item, add it to cart
        return [...prevCart, item];
      }
    });
  };

  // Remove item by index
  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  // Update quantity of a specific item
  const updateQuantity = (index, quantity) => {
    if (quantity < 1) return; // prevent negative/zero quantity
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      updatedCart[index].quantity = quantity;
      return updatedCart;
    });
  };

  // Clear cart completely
  const clearCart = () => setCart([]);

  // Calculate total cost
  const getCartTotal = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
