import { Application, RequestHandler } from 'express';

type ControllerMap = Record<string, RequestHandler>;

function setRoutes(app: Application, indexController: ControllerMap): void {
  app.get('/', indexController.home);
  app.get('/about', indexController.about);
  // Add more routes as needed
}

export default setRoutes;
