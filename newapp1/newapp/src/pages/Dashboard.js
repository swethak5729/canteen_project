import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ color: "#185a9d", marginBottom: "10px" }}>
        Welcome to SNGCE Smart Canteen
      </h1>
      <p style={{ fontSize: "18px", color: "#666666ff", marginBottom: "40px" }}>
        Hello, <strong>{user.name}</strong>!         ({user.role})
      </p>

      <img
        src="/images/home.png"
        alt="Food Ordering"
        style={{
          width: "80%",
          maxWidth: "600px",
          borderRadius: "10px",
          boxShadow: "2px 2px 12px #aaa",
        }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

export default Dashboard;