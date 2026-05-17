import React, { useEffect, useState } from "react";

function UpdateOrderStatus() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all paid orders from backend
  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/orders");
      const data = await response.json();
      
      if (data.success) {
        // Filter only paid orders
        const paidOrders = data.orders.filter(order => 
          order.payment_status === "completed"
        ) || [];
        setOrders(paidOrders);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready_to_serve': return 'green';
      case 'preparing': return 'orange';
      case 'partially_completed': return 'blue';
      case 'completed': return 'purple';
      default: return 'gray';
    }
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
      <h2 style={{ textAlign: "center", color: "#185a9d" }}>Update Order Status</h2>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center" }}>No paid orders yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "#43cea2", color: "white" }}>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Order ID</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Token</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>User</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Items</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Current Status</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Update Status</th>
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
                      <div key={i} style={{ marginBottom: "3px" }}>
                        {item.name} x {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td style={{ 
                    border: "1px solid #ccc", 
                    padding: "8px",
                    color: getStatusColor(order.order_status),
                    fontWeight: "bold"
                  }}>
                    {order.order_status.replace('_', ' ').toUpperCase()}
                  </td>
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
                      <option value="preparing">Preparing</option>
                      <option value="partially_completed">Partially Completed</option>
                      <option value="ready_to_serve">Ready to Serve</option>
                      <option value="completed">Completed</option>
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

export default UpdateOrderStatus;