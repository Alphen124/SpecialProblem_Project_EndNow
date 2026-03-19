import { Request, Response } from 'express';

class IndexController {
  handleGetRequest(_req: Request, res: Response): void {
    res.send('GET request handled');
  }

  handlePostRequest(_req: Request, res: Response): void {
    res.send('POST request handled');
  }
}

export default IndexController;
