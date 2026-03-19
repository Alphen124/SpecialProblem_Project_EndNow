"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRoutes = setRoutes;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
function setRoutes(app) {
    // Serve static assets from /public
    app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
    // Home page
    app.get('/', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
    });
    // Login page
    app.get('/login', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'login.html'));
    });
    // Register page
    app.get('/register', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'register.html'));
    });
    // Rent-out history page
    app.get('/rentout', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'rentout.html'));
    });
    // Give-out (admin/department) page
    app.get('/giveout', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'giveout.html'));
    });
    // Rent type selection page
    app.get('/renttype', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'renttype.html'));
    });
    // Borrow type selection page
    app.get('/borrowtype', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'borrowtype.html'));
    });
    // Rent type device results page
    app.get('/renttypedevice', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'renttypedevice.html'));
    });
    // Borrow type device results page
    app.get('/borrowtypedevice', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'borrowtypedevice.html'));
    });
    // Search device — reuses rent device detail page
    app.get('/searchdevice', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'rentdevice.html'));
    });
    // Borrow device detail page
    app.get('/borrowdevice', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'borrowdevice.html'));
    });
    // Device history page (rent + borrow)
    app.get('/devicehistory', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '..', 'public', 'devicehistory.html'));
    });
    // Simple health check
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
}
