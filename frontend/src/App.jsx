import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Library from './pages/Library';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import SkillsModal from './components/SkillsModal';
import SkillsButton from './components/SkillsButton';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header user={user} onLogout={handleLogout} />
        <Routes>
          <Route 
            path="/" 
            element={user ? <Home /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/library" 
            element={user ? <Library /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/search" 
            element={user ? <Search /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} 
          />
        </Routes>
        
        {/* Skills Modal and Button - only show when user is logged in */}
        {user && (
          <>
            <SkillsButton onClick={() => {
              setSkillsModalOpen(true)
              console.log("button clicked!");
              }} />
            <SkillsModal 
              isOpen={skillsModalOpen} 
              onClose={() => setSkillsModalOpen(false)} 
            />
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
