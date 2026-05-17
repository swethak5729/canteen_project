// src/pages/OrdersView.js
import React, { useEffect, useState } from "react";

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [paymentUpdatingId, setPaymentUpdatingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current user
  const user = JSON.parse(localStorage.getItem("user")); // { role: "admin" or "kitchen" }

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/orders");
      const data = await response.json();

      if (data.success) {
        const parsed = (data.orders || []).map((o) => ({
          ...o,
          items: typeof o.items === "string" ? JSON.parse(o.items) : o.items || [],
        }));
        setOrders(parsed);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOrders = [...orders]
    .slice()
    .reverse() // Reverse for descending order (latest first)
    .slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // Mark order as ready (for kitchen staff)
  const handleMarkReady = async (orderId) => {
    if (!orderId) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready_to_serve" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, order_status: "ready_to_serve" } : o
          )
        );
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle payment accept/reject for monthly (admin only)
  const handlePaymentAction = async (orderId, action) => {
    if (!orderId || !["accept", "reject"].includes(action)) return;
    setPaymentUpdatingId(orderId);
    try {
      const res = await fetch(
        `http://localhost:5000/api/orders/${orderId}/payment-action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
        );
      } else if (data.success) {
        fetchOrders();
      } else {
        alert(data.message || "Failed to apply payment action");
      }
    } catch (err) {
      console.error("Payment action error:", err);
      alert("Server error while applying payment action");
    } finally {
      setPaymentUpdatingId(null);
    }
  };

  if (loading)
    return <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#185a9d" }}>
        Admin - View Ordered Items
      </h2>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center" }}>No orders found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "900px",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#43cea2",
                  color: "white",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "8px 10px" }}>SL No</th>
                <th style={{ padding: "8px 10px" }}>Token</th>
                <th style={{ padding: "8px 10px" }}>User</th>
                <th style={{ padding: "8px 10px" }}>Ordered Items</th>
                <th style={{ padding: "8px 10px" }}>Amount</th>
                <th style={{ padding: "8px 10px" }}>Payment</th>
                <th style={{ padding: "8px 10px" }}>Order Status</th>
                <th style={{ padding: "8px 10px" }}>Date</th>
                {user.role === "kitchen" && (
                  <th style={{ padding: "8px 10px" }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    background: idx % 2 === 0 ? "#fff" : "#fbfbfb",
                  }}
                >
                  <td style={{ padding: "10px" }}>
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>

                  <td style={{ padding: "10px", fontWeight: 700 }}>{order.token}</td>

                  <td style={{ padding: "10px" }}>{order.user_name}</td>

                  <td style={{ padding: "10px" }}>
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, i) => (
                        <div key={i}>
                          <strong>{item.name}</strong> × {item.quantity} (₹{item.price})
                        </div>
                      ))
                    ) : (
                      <em>No items</em>
                    )}
                  </td>

                  <td style={{ padding: "10px" }}>₹{order.amount}</td>

                  {/* Payment column */}
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {order.payment_type === "monthly" ? (
                      order.payment_status === "completed" ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          monthly
                        </span>
                      ) : user.role === "admin" ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                          }}
                        >
                          <button
                            disabled={paymentUpdatingId === order.id}
                            onClick={() => handlePaymentAction(order.id, "accept")}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "none",
                              background:
                                paymentUpdatingId === order.id ? "#ccc" : "#28a745",
                              color: "white",
                              cursor:
                                paymentUpdatingId === order.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {paymentUpdatingId === order.id ? "..." : "Accept"}
                          </button>
                          <button
                            disabled={paymentUpdatingId === order.id}
                            onClick={() => handlePaymentAction(order.id, "reject")}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "none",
                              background:
                                paymentUpdatingId === order.id ? "#ccc" : "#dc3545",
                              color: "white",
                              cursor:
                                paymentUpdatingId === order.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {paymentUpdatingId === order.id ? "..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#666", fontStyle: "italic" }}>
                          Awaiting Payment
                        </span>
                      )
                    ) : (
                      <span style={{ color: "green", fontWeight: 700 }}>instant</span>
                    )}
                  </td>

                  {/* Order status */}
                  <td
                    style={{
                      padding: "10px",
                      color:
                        order.order_status === "ready_to_serve"
                          ? "green"
                          : order.order_status === "preparing"
                          ? "orange"
                          : "blue",
                      fontWeight: 700,
                    }}
                  >
                    {String(order.order_status).replace(/_/g, " ").toUpperCase()}
                  </td>

                  {/* Date */}
                  <td style={{ padding: "10px" }}>
                    {order.order_date
                      ? new Date(order.order_date).toLocaleString()
                      : "-"}
                  </td>

                  {/* Action for kitchen only */}
                  {user.role === "kitchen" && (
                    <td style={{ padding: "10px" }}>
                      {order.order_status === "preparing" ? (
                        <button
                          disabled={
                            updatingId === order.id ||
                            order.payment_status !== "completed"
                          }
                          onClick={() => handleMarkReady(order.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "none",
                            cursor:
                              updatingId === order.id ||
                              order.payment_status !== "completed"
                                ? "not-allowed"
                                : "pointer",
                            background:
                              updatingId === order.id
                                ? "#ccc"
                                : order.payment_status === "completed"
                                ? "#28a745"
                                : "#999",
                            color: "white",
                            fontWeight: 700,
                          }}
                        >
                          {updatingId === order.id
                            ? "Updating..."
                            : order.payment_status === "completed"
                            ? "Order Ready"
                            : "Awaiting Payment"}
                        </button>
                      ) : (
                        <span style={{ color: "#666", fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div
            style={{
              marginTop: 15,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              style={{
                padding: "8px 14px",
                background: currentPage === 1 ? "#ccc" : "#185a9d",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              ⬅ Previous
            </button>

            <span style={{ fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 14px",
                background: currentPage === totalPages ? "#ccc" : "#185a9d",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Next ➡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersView;
