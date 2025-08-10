import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  return (
    <>
      <div className="header-bar">
        <div className="auth-actions-fixed">
          {user ? (
            <form onSubmit={(e) => { e.preventDefault(); onLogout(); }} style={{ display: 'inline' }}>
              <button type="submit" className="btn btn-auth">Logout</button>
            </form>
          ) : (
            <>
              <Link to="/login" className="btn btn-auth">Login</Link>
              <Link to="/register" className="btn btn-auth">Register</Link>
            </>
          )}
        </div>
        <div className="home-actions-center">
          <nav className="home-actions">
            <Link to="/" className="btn">Home</Link>
            <Link to="/search" className="btn">Search Books</Link>
            <Link to="/library" className="btn">My Library</Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
