import React, { useEffect, useState } from "react";

function QueueGrid() {
  const [allTokens, setAllTokens] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(0); // index of current 10-token batch

  useEffect(() => {
    // Initialize 50 tokens for the interval
    const tokens = Array.from({ length: 50 }, (_, i) => ({
      token: i + 1,
      status: i % 10 < 5 ? "blue" : "green" // slots 1-5 blue, 6-10 green
    }));

    // Example booked walk-in tokens
    const bookedTokens = [7, 9, 16, 22, 35]; // example booked tokens
    const updatedTokens = tokens.map(t =>
      bookedTokens.includes(t.token) ? { ...t, status: "red" } : t
    );

    setAllTokens(updatedTokens);
  }, []);

  // Rotate to next batch every 5 seconds (example)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBatch(prev => (prev + 1) % 5); // 50 tokens / 10 = 5 batches
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSlotColor = (status) => {
    switch (status) {
      case "blue": return "#3b82f6";  // Online
      case "green": return "#10b981"; // Available walk-in
      case "red": return "#ef4444";   // Booked walk-in
      default: return "#9ca3af";
    }
  };

  // Get current 10-token batch
  const batchTokens = allTokens.slice(currentBatch * 10, currentBatch * 10 + 10);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2 style={{ color: "#185a9d", marginBottom: "20px" }}>Queue Token Map</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "15px",
        justifyItems: "center"
      }}>
        {batchTokens.map(slot => (
          <div
            key={slot.token}
            style={{
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              backgroundColor: getSlotColor(slot.status),
              color: "white",
              fontWeight: "bold",
              fontSize: "20px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
            }}
          >
            {slot.token}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", color: "#185a9d", fontSize: "14px" }}>
        <p><strong>Blue:</strong> Online Order</p>
        <p><strong>Green:</strong> Available Walk-in</p>
        <p><strong>Red:</strong> Booked Walk-in</p>
      </div>

      <p style={{ marginTop: "10px", color: "#666" }}>
        Displaying tokens {currentBatch * 10 + 1} - {currentBatch * 10 + 10} of 50
      </p>
    </div>
  );
}

export default QueueGrid;
