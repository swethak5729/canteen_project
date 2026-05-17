// src/pages/AdminQueue.js
import React, { useState } from "react";

function AdminQueue() {
  // Example: 50 tokens, initially some are booked
  const [tokens, setTokens] = useState(
    Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      booked: false,
    }))
  );

  // Toggle token booking
  const toggleToken = (id) => {
    setTokens((prevTokens) =>
      prevTokens.map((token) =>
        token.id === id ? { ...token, booked: !token.booked } : token
      )
    );
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2 style={{ color: "#185a9d" }}>Admin Queue Management</h2>
      <p>Click a token to mark as booked (red) or available (green).</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)", // 10 tokens per row
          gap: "10px",
          maxWidth: "600px",
          margin: "20px auto",
        }}
      >
        {tokens.map((token) => (
          <div
            key={token.id}
            onClick={() => toggleToken(token.id)}
            style={{
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor: token.booked ? "red" : "green",
              color: "white",
              fontWeight: "bold",
              userSelect: "none",
            }}
          >
            {token.id}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminQueue;
