const path = require('path');
const express = require('express');

function setRoutes(app) {
    // Serve static assets from /public
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // Home page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    // Login page
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
    });

    // Rent-out history page
    app.get('/rentout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'rentout.html'));
});
    
    // Simple health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
}

module.exports = { setRoutes };