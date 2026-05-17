// src/pages/Cart.js
import React, { useContext, useState, useEffect } from "react";
import { CartContext } from "../CartContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } =
    useContext(CartContext);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [paymentType, setPaymentType] = useState("Instant");

  const total = getCartTotal();

  const buttonStyle = {
    padding: "10px 20px",
    background: "#43cea2",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
    fontWeight: "bold",
  };

  const showPopup = (type, title, text) => {
    const icons = {
      success: "success",
      error: "error",
      warning: "warning",
      info: "info",
    };

    Swal.fire({
      icon: icons[type] || "info",
      title,
      text,
      background: "#fefefe",
      color: "#333",
      confirmButtonColor:
        type === "success"
          ? "#43cea2"
          : type === "error"
          ? "#e74c3c"
          : type === "warning"
          ? "#f39c12"
          : "#3498db",
      confirmButtonText: "OK",
      customClass: {
        popup: "swal2-rounded swal2-shadow",
      },
    });
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(index, newQuantity);
  };

  const proceedToCheckout = async () => {
    try {
      if (!user) {
        showPopup("warning", "Login Required ⚠️", "Please log in to place your order.");
        return;
      }

      if (cart.length === 0) {
        showPopup("info", "Empty Cart 🛒", "Please add items before checkout.");
        return;
      }

      const itemsToSend = cart.map((ci) => ({
        item_id: ci.id || ci.item_id || 0,
        name: ci.name,
        price: Number(ci.price || 0),
        quantity: Number(ci.quantity || 1),
      }));

      const payload = {
        user_id: user.user_id || user.id || user.userId,
        user_name: user.name,
        role: user.role,
        items: itemsToSend,
        amount: getCartTotal(),
        payment_type: paymentType.toLowerCase(),
      };

      const resp = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!data.success) {
        showPopup("error", "Order Failed ❌", data.message || "Something went wrong.");
        return;
      }

      // 🎉 Different popup for payment type
      if (paymentType.toLowerCase() === "instant") {
        showPopup(
          "success",
          "Payment Successful 💳",
          `Your order has been placed successfully!\n\nToken: ${data.token}\nAmount: ₹${data.order.amount}\nPayment Type: Instant`
        );
      } else {
        showPopup(
          "info",
          "Order Added to Monthly Bill 📅",
          `Your order has been placed successfully!\n\nToken: ${data.token}\nAmount: ₹${data.order.amount}\nPayment Type: Monthly`
        );
      }

      // Save the order locally (for user history)
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.unshift(data.order);
      localStorage.setItem("orders", JSON.stringify(orders));

      clearCart();

      // Redirect to menu after short delay
      setTimeout(() => navigate("/menu"), 2000);
    } catch (err) {
      console.error("Checkout error:", err);
      showPopup("error", "Network Error 🌐", "Unable to connect. Please try again later.");
    }
  };

  useEffect(() => {
    // You can enable role-based access later if needed
  }, [user, navigate]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "#185a9d", marginBottom: "30px", textAlign: "center" }}>
        Your Cart
      </h2>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🛒</div>
          <p style={{ fontSize: "18px", marginBottom: "30px" }}>Your cart is empty</p>
          <button onClick={() => navigate("/menu")} style={buttonStyle}>
            Browse Menu
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div style={{ marginBottom: "30px" }}>
            {cart.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  borderBottom: "1px solid #eee",
                  background: "white",
                  borderRadius: "8px",
                  marginBottom: "10px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ flex: 2 }}>
                  <h4 style={{ margin: "0 0 5px 0", color: "#185a9d" }}>{item.name}</h4>
                  <p style={{ margin: 0, color: "#666" }}>₹{item.price} each</p>
                </div>

                <div
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <button
                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                    style={{
                      padding: "5px 10px",
                      background: "#f0f0f0",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: "bold", minWidth: "30px", textAlign: "center" }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                    style={{
                      padding: "5px 10px",
                      background: "#f0f0f0",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ flex: 1, textAlign: "right" }}>
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                    ₹{item.price * item.quantity}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  style={{
                    padding: "5px 10px",
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    marginLeft: "10px",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Payment Type */}
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <label style={{ marginRight: "10px", fontWeight: "bold" }}>Payment Type:</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontWeight: "bold",
              }}
            >
              <option value="Instant">Instant Payment</option>
              <option value="Monthly">Monthly Payment</option>
            </select>
          </div>

          {/* Order Summary */}
          <div
            style={{
              background: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ marginBottom: "15px", color: "#185a9d" }}>Order Summary</h3>
            {cart.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <hr />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              <span>Grand Total:</span>
              <span>₹{total}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button onClick={clearCart} style={{ ...buttonStyle, background: "#ff6b6b" }}>
              Clear Cart
            </button>
            <button onClick={() => navigate("/menu")} style={{ ...buttonStyle, background: "#6c757d" }}>
              Continue Shopping
            </button>
            <button onClick={proceedToCheckout} style={buttonStyle}>
              ✅ Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;