import { Router, json } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const rdfRouter = Router();

rdfRouter.post('/rdf', async (req, res) => {
  const formData = req.body;
  console.log(formData);
  res.send('Data recieved!');
});

export default rdfRouter;
