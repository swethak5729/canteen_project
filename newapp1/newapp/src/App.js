import Notifications from './pages/Notifications';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import PlaceOrder from './pages/PlaceOrder';
import Queue from './pages/Queue';
import OrderHistory from './pages/OrderHistory';
import ViewPayments from './pages/ViewPayments'; // Correct import
import OrdersView from './pages/OrdersView';
import AdminQueue from './pages/AdminQueue';
import StaffOrderView from './pages/StaffOrderView';
import UpdateOrderStatus from './pages/UpdateOrderStatus';
import Logout from './pages/Logout';
import Navigation from './components/Navigation';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/placeorder" element={<PlaceOrder />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/admin/payments" element={<ViewPayments />} />  {/* Updated */}
            <Route path="/admin/orders" element={<OrdersView />} />
            <Route path="/admin/queue" element={<AdminQueue />} />
            <Route path="/staff/orders" element={<StaffOrderView />} />
            <Route path="/update-status" element={<UpdateOrderStatus />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
