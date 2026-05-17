// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import axios from "axios";

// ----------- Pages -----------
const Login = ({ setUser }) => {
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", {
        emailOrId,
        password,
        role
      });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Check credentials.");
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email or ID:</label>
          <input value={emailOrId} onChange={(e) => setEmailOrId(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
            <option value="kitchen">Kitchen Staff</option>
          </select>
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

// ----------- Student Pages -----------
const Dashboard = () => <h2>Student / Faculty Dashboard</h2>;
const Menu = () => <h2>Menu Page</h2>;
const Cart = () => <h2>Cart Page</h2>;
const MyOrders = () => <h2>My Orders Page</h2>;
const Notifications = () => <h2>Notifications Page</h2>;

// ----------- Admin Pages -----------
const ViewOrders = () => <h2>Admin - View Orders</h2>;
const AdminViewItems = () => <h2>Admin - View / Update Menu Items</h2>;
const PaymentView = () => <h2>Admin - Payment View</h2>;
const QueueView = () => <h2>Admin - Queue View</h2>;

// ----------- Kitchen Staff Pages -----------
const OrderView = () => <h2>Kitchen Staff - Order View</h2>;
const UpdateStatus = () => <h2>Kitchen Staff - Update Status</h2>;

// ----------- Logout -----------
const Logout = ({ setUser }) => {
  useEffect(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, [setUser]);

  return <Navigate to="/" />;
};

// ----------- Protected Route Component -----------
const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" />;
  return children;
};

// ----------- Main App -----------
function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  return (
    <Router>
      {user && <Sidebar user={user} />}
      <div style={{ marginLeft: user ? "240px" : "0", padding: "20px" }}>
        <Routes>
          <Route path="/" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />

          {/* Student / Faculty Routes */}
          <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
          <Route path="/menu" element={<ProtectedRoute user={user}><Menu /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute user={user}><Cart /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute user={user}><MyOrders /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute user={user}><Notifications /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/view-orders" element={<ProtectedRoute user={user}><ViewOrders /></ProtectedRoute>} />
          <Route path="/view-items" element={<ProtectedRoute user={user}><AdminViewItems /></ProtectedRoute>} />
          <Route path="/payment-view" element={<ProtectedRoute user={user}><PaymentView /></ProtectedRoute>} />
          <Route path="/queue-view" element={<ProtectedRoute user={user}><QueueView /></ProtectedRoute>} />

          {/* Kitchen Staff Routes */}
          <Route path="/order-view" element={<ProtectedRoute user={user}><OrderView /></ProtectedRoute>} />
          <Route path="/update-status" element={<ProtectedRoute user={user}><UpdateStatus /></ProtectedRoute>} />

          {/* Logout */}
          <Route path="/logout" element={<Logout setUser={setUser} />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<h2>Page not found</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
