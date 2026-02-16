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

        // Give-out (admin/department) page
        app.get('/giveout', (req, res) => {
                res.sendFile(path.join(__dirname, '..', 'public', 'giveout.html'));
        });
    
        // Rent type selection page
        app.get('/renttype', (req, res) => {
                res.sendFile(path.join(__dirname, '..', 'public', 'renttype.html'));
        });

        // Borrow type selection page (new)
        app.get('/borrowtype', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'borrowtype.html'));
        });

        // Rent type device results page
        app.get('/renttypedevice', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'renttypedevice.html'));
        });
        // Borrow type device results page
        app.get('/borrowtypedevice', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'borrowtypedevice.html'));
        });
        // Provide a searchdevice route that reuses the rent device detail page
        app.get('/searchdevice', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'rentdevice.html'));
        });
        // Borrow device detail page
        app.get('/borrowdevice', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'borrowdevice.html'));
        });

        // Device history page (rent + borrow)
        app.get('/devicehistory', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'devicehistory.html'));
        });
    
    // Simple health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
}

module.exports = { setRoutes };