"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setRoutes(app, indexController) {
    app.get('/', indexController.home);
    app.get('/about', indexController.about);
    // Add more routes as needed
}
exports.default = setRoutes;
