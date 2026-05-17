import React, { createContext, useState } from "react";

export const QueueContext = createContext();

export const QueueProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);

  const addOrderToQueue = (order) => {
    setQueue((prev) => [...prev, order]);
  };

  return (
    <QueueContext.Provider value={{ queue, addOrderToQueue }}>
      {children}
    </QueueContext.Provider>
  );
};
