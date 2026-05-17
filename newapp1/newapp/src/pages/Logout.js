import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Clear stored data (optional, for future login system)
    localStorage.clear();

    // ✅ Redirect to Home after 1 second
    setTimeout(() => {
      navigate("/");
    }, 1000);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>You have been logged out successfully ✅</h2>
      <p>Redirecting to Home...</p>
    </div>
  );
}

export default Logout;
