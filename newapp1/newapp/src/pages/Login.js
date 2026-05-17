import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [role, setRole] = useState("");
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!role) {
      setError("⚠ Please select a role.");
      setLoading(false);
      return;
    }
    if (!emailOrId || !password) {
      setError("⚠ All fields are required!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrId: emailOrId,
          password: password,
          role: role
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getInputLabel = () => {
    switch (role) {
      case "student":
        return "Student Email / Student ID:";
      case "faculty":
        return "Faculty Email / Faculty ID:";
      case "admin":
        return "Admin Email / Admin ID:";
      case "kitchen":
        return "Kitchen Staff Email / Staff ID:";
      default:
        return "Email or User ID:";
    }
  };

  return (
    <div style={{
      maxWidth: "400px",
      margin: "50px auto",
      padding: "30px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      background: "white",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", color: "#185a9d", marginBottom: "30px" }}>
        Login to SNGCE Canteen
      </h2>
      
      {error && (
        <div style={{ 
          color: "red", 
          textAlign: "center", 
          background: "#ffe6e6", 
          padding: "10px", 
          borderRadius: "5px",
          marginBottom: "20px",
          border: "1px solid red"
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px"
            }}
            required
          >
            <option value="">-- Select Role --</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
            <option value="kitchen">Kitchen Staff</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            {getInputLabel()}
          </label>
          <input
            type="text"
            value={emailOrId}
            onChange={(e) => setEmailOrId(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px"
            }}
            placeholder="Enter email or ID"
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px"
            }}
            placeholder="Enter password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "#ccc" : "#43cea2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p>
          Don't have an account?{" "}
          <a href="/register" style={{ color: "#185a9d", textDecoration: "none" }}>
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;



