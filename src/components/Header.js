import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => (
  <header style={{ 
    backgroundColor: '#e50914', 
    padding: '15px 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ margin: 0, fontSize: '28px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          Netflix PWA
        </Link>
      </h1>
      <nav>
        <Link to="/" style={{ 
          color: 'white', 
          marginLeft: '20px',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Accueil
        </Link>
      </nav>
    </div>
  </header>
);

export default Header;