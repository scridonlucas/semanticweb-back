import { Router, json } from 'express';
import axios from 'axios';

const jsonserverRouter = Router();

const url = 'http://localhost:4000/';

jsonserverRouter.get('/', async (_req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default jsonserverRouter;
