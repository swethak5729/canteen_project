  import React, { useEffect, useState } from "react";

  function ViewPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showMonthlyDue, setShowMonthlyDue] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [monthlyTotal, setMonthlyTotal] = useState(0);
    const [settling, setSettling] = useState(false);

    // Fetch all payment history
    const fetchPayments = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/payments");
        const data = await response.json();

        if (data.success) {
          setPayments(data.payments || []);
          setError("");
        } else {
          setError("Failed to load payments: " + (data.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("Network error. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    const settlePayments = async () => {
      if (!selectedUser || !startDate || !endDate) {
        alert("Select user and date range before settling.");
        return;
      }
    
      if (filteredPayments.length === 0) {
        alert("No payments selected to settle.");
        return;
      }
    
      const confirmMsg = `You're about to mark ${filteredPayments.length} order(s) as instant for user ${selectedUser} from ${startDate} to ${endDate}. Continue?`;
      if (!window.confirm(confirmMsg)) return;
    
      // collect only the filtered order ids
      const ids = filteredPayments.map(p => p.id);
    
      try {
        setSettling(true);
        const res = await fetch("http://localhost:5000/api/admin/payments/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedUser,
            start_date: startDate,
            end_date: endDate,
            ids // <-- send explicit list of ids to update
          }),
        });
    
        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Success. Updated ${data.updatedRows} order(s).`);
          // refresh data & clear filters
          refresh();
          setSelectedUser("");
          setStartDate("");
          setEndDate("");
          setFilteredPayments([]);
          setMonthlyTotal(0);
        } else {
          alert("Failed to settle payments: " + (data.message || res.statusText || JSON.stringify(data)));
        }
      } catch (err) {
        console.error("Error settling payments:", err);
        alert("Network error while settling payments.");
      } finally {
        setSettling(false);
      }
    };
    

    // Fetch users for dropdown
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/users");
        const data = await res.json();
        if (data.success) {
          setUsersList(data.users || []);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    useEffect(() => {
      fetchPayments();
      fetchUsers();
    }, []);

    const refresh = () => {
      setLoading(true);
      fetchPayments();
      setFilteredPayments([]);
      setMonthlyTotal(0);
    };

    const openMonthlyDue = () => {
      setShowMonthlyDue(true);
    };

    const applyMonthlyFilter = () => {
      if (!selectedUser || !startDate || !endDate) {
        alert("Please select user and date range.");
        return;
      }
    
      // Build inclusive day boundaries
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // start of startDate
    
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // end of endDate
    
      const filtered = payments.filter((p) => {
        const pUserId = String(p.user_id);
        const paymentDate = new Date(p.order_date);
        return (
          pUserId === selectedUser &&
          p.payment_type === "monthly" &&
          paymentDate >= start &&
          paymentDate <= end
        );
      });
    
      setFilteredPayments(filtered);
    
      const total = filtered.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      setMonthlyTotal(total);
    
      setShowMonthlyDue(false);
    };
    

    const displayPayments = filteredPayments.length > 0 ? filteredPayments : payments;


    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>💳</div>
          <p>Loading payment history...</p>
        </div>
      );
    }

    return (
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#185a9d", margin: 0 }}>💰 Payment History</h2>
          <div>
            <button
              onClick={openMonthlyDue}
              style={{ padding: "8px 16px", background: "#f5a623", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", marginRight: "10px" }}
            >
              📅 Monthly Due
            </button>
            <button
          onClick={settlePayments}
          disabled={settling}
          style={{
            padding: "8px 14px",
            background: settling ? "#999" : "#1e88e5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: settling ? "not-allowed" : "pointer",
            fontWeight: "bold",
            marginLeft: "8px",
            marginRight: "10px"
          }}
        >
          {settling ? "Settling..." : "Settle Payment"}
        </button>
            <button
              onClick={refresh}
              style={{ padding: "8px 16px", background: "#43cea2", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#ffe6e6", color: "red", padding: "15px", borderRadius: "5px", marginBottom: "20px", border: "1px solid red" }}>
            {error}
          </div>
        )}

        {displayPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>📭</div>
            <p>No payments found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", background: "white", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#185a9d", color: "white" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>Payment ID</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>User</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Order ID</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Amount</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Payment Type</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {displayPayments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>#{p.id}</td>
                    <td style={{ padding: "10px" }}>
                      <div>{p.user_name}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{p.user_id}</div>
                    </td>
                    <td style={{ padding: "10px" }}>#{p.order_id}</td>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>₹{p.amount}</td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          background: p.payment_type === "instant" ? "#e8f5e8" : "#e8f4f8",
                          color: p.payment_type === "instant" ? "#2e7d32" : "#1565c0",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {p.payment_type}
                      </span>
                    </td>
                    <td style={{ padding: "10px", color: "#555" }}>
                      {new Date(p.order_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredPayments.length > 0 && (
          <div style={{ marginTop: "10px", textAlign: "right", fontWeight: "bold" }}>
            Total Amount (Monthly Due): ₹{monthlyTotal}
          </div>
        )}

        <div style={{ marginTop: "20px", textAlign: "center", color: "#666" }}>
          <p>Total Payments: <strong>{displayPayments.length}</strong></p>
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Monthly Due Popup */}
        {showMonthlyDue && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginBottom: "20px" }}>Monthly Due Filter</h3>
              <div style={{ marginBottom: "15px" }}>
                <label>User:</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                >
                  <option value="">Select User</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.user_id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label>Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%", padding: "8px", marginTop: "5px" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label>End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "100%", padding: "8px", marginTop: "5px" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setShowMonthlyDue(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={applyMonthlyFilter} style={{ padding: "8px 16px", background: "#43cea2", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default ViewPayments;
