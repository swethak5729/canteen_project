import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./CartContext";
import { QueueProvider } from "./QueueContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <CartProvider>
    <QueueProvider>
      <App />
    </QueueProvider>
  </CartProvider>
);
