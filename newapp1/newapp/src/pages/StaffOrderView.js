import React, { useEffect, useState } from "react";

function StaffOrderView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all paid orders from backend
  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/orders");
      const data = await res.json();
      
      if (data.success) {
        // Filter only orders that are paid and not completed
        const kitchenOrders = data.orders.filter(order => 
          order.payment_status === "completed" && 
          order.order_status !== "completed"
        ) || [];
        setOrders(kitchenOrders);
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
    const interval = setInterval(fetchOrders, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchOrders(); // refresh orders after update
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    }
  };

  const getStatusOptions = (currentStatus) => {
    const statuses = [
      { value: "preparing", label: "Preparing" },
      { value: "partially_completed", label: "Partially Completed" },
      { value: "ready_to_serve", label: "Ready to Serve" },
      { value: "completed", label: "Completed" }
    ];

    const currentIndex = statuses.findIndex(s => s.value === currentStatus);
    return statuses.slice(currentIndex);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#185a9d" }}>Kitchen Staff - Order View</h2>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center" }}>No orders to prepare.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "#43cea2", color: "white" }}>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Order ID</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Token</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>User</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Items</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Amount</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold" }}>{order.token}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.user_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: "5px" }}>
                        <strong>{item.name}</strong> x {item.quantity}
                        {item.quantity > 1 && ` (₹${item.price} each)`}
                      </div>
                    ))}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>₹{order.amount}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <select
                      value={order.order_status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        padding: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        width: "100%"
                      }}
                    >
                      {getStatusOptions(order.order_status).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StaffOrderView;