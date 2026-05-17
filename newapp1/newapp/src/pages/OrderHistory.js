import React, { useEffect, useState } from "react";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/user/orders/${user.user_id}`);
        const data = await response.json();

        if (data.success) {
          const normalized = (data.orders || []).map((o) => ({
            ...o,
            items: Array.isArray(o.items)
              ? o.items
              : o.items
              ? JSON.parse(o.items)
              : [],
          }));

          // Sort by token number (ascending)
          const sortedOrders = normalized.sort((a, b) => {
            const tokenA = parseInt(a.token);
            const tokenB = parseInt(b.token);
            return tokenA - tokenB;
          });

          setOrders(sortedOrders);

          const monthlySum = sortedOrders
            .filter((order) => (order.payment_type || "").toLowerCase() === "monthly")
            .reduce((sum, order) => sum + Number(order.amount || 0), 0);

          setMonthlyTotal(monthlySum);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const user = JSON.parse(localStorage.getItem("user"));

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading order history...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Please login to view your order history.</p>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#185a9d" }}>Order History</h2>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h3>Welcome, {user.name}!</h3>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center" }}>You have not ordered anything yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "90%",
              margin: "auto",
              borderCollapse: "collapse",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr style={{ background: "#43cea2", color: "white" }}>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Sl. No</th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Token</th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Items</th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Total Amount</th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Payment Type</th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Status</th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Order Date</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order, index) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {(currentPage - 1) * itemsPerPage + (index + 1)}
                  </td>
                  <td style={{ padding: "10px", fontWeight: "bold", textAlign: "center" }}>
                    {order.token}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: "5px" }}>
                        {item.name} x {item.quantity} @ ₹{item.price}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: "10px", fontWeight: "bold", textAlign: "center" }}>
                    ₹{order.amount}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      color: order.payment_type === "monthly" ? "blue" : "green",
                      textAlign: "center",
                    }}
                  >
                    {order.payment_type === "monthly" ? "Monthly" : "Instant"}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      color:
                        order.order_status === "completed"
                          ? "green"
                          : order.order_status === "ready_to_serve"
                          ? "blue"
                          : "orange",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {order.order_status === "ready_to_serve"
                      ? "ORDER READY"
                      : order.order_status.replace("_", " ").toUpperCase()}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {new Date(order.order_date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {orders.length > itemsPerPage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            style={{
              padding: "8px 15px",
              marginRight: "10px",
              backgroundColor: currentPage === 1 ? "#ccc" : "#185a9d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>
          <span style={{ fontWeight: "bold" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 15px",
              marginLeft: "10px",
              backgroundColor: currentPage === totalPages ? "#ccc" : "#185a9d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Monthly Summary */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3>
          Total Monthly Dues:{" "}
          <span style={{ color: "green", fontSize: "24px" }}>₹{monthlyTotal}</span>
        </h3>
        {monthlyTotal > 0 && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            Please settle your monthly dues at the accounts office.
          </p>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;