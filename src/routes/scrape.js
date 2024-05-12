import { Router } from 'express';

const scrapeRouter = Router();

scrapeRouter.get('/', async (_req, res) => {
  res.json('result');
});

export default scrapeRouter;
