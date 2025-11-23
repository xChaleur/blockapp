import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  // Use relative path for API calls (works in both dev and production)
  const API_URL = '/api';

  // Load counter and check database status on mount
  useEffect(() => {
    fetchCounter();
    checkDatabaseStatus();
  }, []);

  const fetchCounter = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/counter/${userId}`);
      setCount(response.data.count);
    } catch (error) {
      console.error('Error fetching counter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    try {
      const response = await axios.post(`${API_URL}/counter/${userId}/increment`);
      setCount(response.data.count);
    } catch (error) {
      console.error('Error incrementing:', error);
    }
  };

  const handleDecrement = async () => {
    try {
      const response = await axios.post(`${API_URL}/counter/${userId}/decrement`);
      setCount(response.data.count);
    } catch (error) {
      console.error('Error decrementing:', error);
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post(`${API_URL}/counter/${userId}/reset`);
      setCount(response.data.count);
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setDbStatus(response.data);
    } catch (error) {
      setDbStatus({ 
        status: 'ERROR', 
        database: 'Disconnected',
        error: error.message 
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to My React Webpage <span style={{ fontSize: '14px', color: '#999', marginLeft: '20px' }}>(v3.0.0)</span></h1>
        <p>This is a basic React application with modern styling.</p>
        
        <div className="counter-section">
          <h2>Interactive Counter</h2>
          
          {/* Database Status Indicator */}
          {dbStatus && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '5px',
              backgroundColor: dbStatus.database === 'Connected' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${dbStatus.database === 'Connected' ? '#28a745' : '#dc3545'}`,
              color: dbStatus.database === 'Connected' ? '#155724' : '#721c24'
            }}>
              <strong>Database Status:</strong> {dbStatus.database === 'Connected' ? '✅ Connected' : '❌ Disconnected'}
            </div>
          )}
          
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>Current count: <span className="count">{count}</span></p>
              <div className="button-group">
                <button onClick={handleIncrement} className="btn btn-primary">
                  Increment
                </button>
                <button onClick={handleDecrement} className="btn btn-secondary">
                  Decrement
                </button>
                <button onClick={handleReset} className="btn btn-reset">
                  Reset
                </button>
              </div>
            </>
          )}
        </div>

        <div className="features-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🚀 Fast</h3>
              <p>Built with React for optimal performance</p>
            </div>
            <div className="feature-card">
              <h3>📱 Responsive</h3>
              <p>Works great on all devices</p>
            </div>
            <div className="feature-card">
              <h3>🎨 Modern</h3>
              <p>Clean and contemporary design</p>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
