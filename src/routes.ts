import path from 'path';
import express, { Application, Request, Response } from 'express';

export function setRoutes(app: Application): void {
  // Serve static assets from /public
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Home page
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // Login page
  app.get('/login', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  });

  // Register page
  app.get('/register', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
  });

  // Rent-out history page
  app.get('/rentout', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'rentout.html'));
  });

  // Give-out (admin/department) page
  app.get('/giveout', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'giveout.html'));
  });

  // Rent type selection page
  app.get('/renttype', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'renttype.html'));
  });

  // Borrow type selection page
  app.get('/borrowtype', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'borrowtype.html'));
  });

  // Rent type device results page
  app.get('/renttypedevice', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'renttypedevice.html'));
  });

  // Borrow type device results page
  app.get('/borrowtypedevice', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'borrowtypedevice.html'));
  });

  // Search device — reuses rent device detail page
  app.get('/searchdevice', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'rentdevice.html'));
  });

  // Borrow device detail page
  app.get('/borrowdevice', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'borrowdevice.html'));
  });

  // Device history page (rent + borrow)
  app.get('/devicehistory', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'devicehistory.html'));
  });

  // Simple health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });
}
