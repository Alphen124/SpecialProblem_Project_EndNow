function setRoutes(app, indexController) {
    app.get('/', indexController.home);
    app.get('/about', indexController.about);
    // Add more routes as needed
}

module.exports = setRoutes;