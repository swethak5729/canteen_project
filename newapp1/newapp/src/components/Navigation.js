import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) {
    return null; // Don't show navigation if user is not logged in
  }

  return (
    <nav style={{
      background: '#185a9d',
      padding: '10px 20px',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/dashboard" style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}>
            SNGCE Canteen
          </Link>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
            {user.role !== 'kitchen' && (
            <Link to="/menu" style={{ color: 'white', textDecoration: 'none' }}>Menu</Link>
            )}
            {user.role !== 'kitchen' && (
            <Link to="/cart" style={{ color: 'white', textDecoration: 'none' }}>Cart</Link>
            )}
            {user.role !== 'kitchen' && (
              <Link to="/order-history" style={{ color: 'white', textDecoration: 'none' }}>My Orders</Link>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/orders" style={{ color: 'white', textDecoration: 'none' }}>Orders Details</Link>
                <Link to="/admin/payments" style={{ color: 'white', textDecoration: 'none' }}>Payments</Link>
              </>
            )}
            
            {user.role === 'kitchen' && (
               <>
                <Link to="/admin/orders" style={{ color: 'white', textDecoration: 'none' }}>Orders Details</Link>
              
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Welcome, {user.name} ({user.role})</span>
          <button 
            onClick={handleLogout}
            style={{
              background: '#43cea2',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;