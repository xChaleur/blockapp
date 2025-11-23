const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.0.50',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2070',
  database: process.env.DB_NAME || 'blockapp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date() 
    });
  }
});

// Get counter for user
app.get('/api/counter/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT count FROM counters WHERE user_id = ?',
      [userId]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      // Create new counter if doesn't exist
      return res.json({ count: 0, userId });
    }
    
    res.json({ count: rows[0].count, userId });
  } catch (error) {
    console.error('Error fetching counter:', error);
    res.status(500).json({ error: 'Failed to fetch counter' });
  }
});

// Update counter
app.post('/api/counter/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { count, action } = req.body;
    const connection = await pool.getConnection();
    
    // Upsert counter
    await connection.query(
      'INSERT INTO counters (user_id, count) VALUES (?, ?) ON DUPLICATE KEY UPDATE count = ?',
      [userId, count, count]
    );
    
    // Log activity
    await connection.query(
      'INSERT INTO activity_log (user_id, action, value) VALUES (?, ?, ?)',
      [userId, action || 'update', count]
    );
    
    connection.release();
    
    res.json({ success: true, count, userId });
  } catch (error) {
    console.error('Error updating counter:', error);
    res.status(500).json({ error: 'Failed to update counter' });
  }
});

// Increment counter
app.post('/api/counter/:userId/increment', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO counters (user_id, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = count + 1',
      [userId]
    );
    
    const [rows] = await connection.query(
      'SELECT count FROM counters WHERE user_id = ?',
      [userId]
    );
    
    await connection.query(
      'INSERT INTO activity_log (user_id, action, value) VALUES (?, ?, ?)',
      [userId, 'increment', rows[0].count]
    );
    
    connection.release();
    
    res.json({ success: true, count: rows[0].count, userId });
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).json({ error: 'Failed to increment counter' });
  }
});

// Decrement counter
app.post('/api/counter/:userId/decrement', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO counters (user_id, count) VALUES (?, 0) ON DUPLICATE KEY UPDATE count = count - 1',
      [userId]
    );
    
    const [rows] = await connection.query(
      'SELECT count FROM counters WHERE user_id = ?',
      [userId]
    );
    
    await connection.query(
      'INSERT INTO activity_log (user_id, action, value) VALUES (?, ?, ?)',
      [userId, 'decrement', rows[0].count]
    );
    
    connection.release();
    
    res.json({ success: true, count: rows[0].count, userId });
  } catch (error) {
    console.error('Error decrementing counter:', error);
    res.status(500).json({ error: 'Failed to decrement counter' });
  }
});

// Reset counter
app.post('/api/counter/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE counters SET count = 0 WHERE user_id = ?',
      [userId]
    );
    
    await connection.query(
      'INSERT INTO activity_log (user_id, action, value) VALUES (?, ?, ?)',
      [userId, 'reset', 0]
    );
    
    connection.release();
    
    res.json({ success: true, count: 0, userId });
  } catch (error) {
    console.error('Error resetting counter:', error);
    res.status(500).json({ error: 'Failed to reset counter' });
  }
});

// Get activity log
app.get('/api/activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT * FROM activity_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
      [userId]
    );
    
    connection.release();
    
    res.json({ activities: rows, userId });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Connected to MySQL at 192.168.0.50`);
});
