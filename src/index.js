import express from 'express';
import scrapeRouter from './routes/scrape.js';
import jsonServerRouter from './routes/jsonserver.js';
import path from 'path';
import cors from 'cors';
import rdfRouter from './routes/rdf.js';
import { fileURLToPath } from 'url';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/json-ld/', (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  res.sendFile(path.join(__dirname, '..', 'sourcePage', 'index.html'));
});

app.use('/api/scrape/', scrapeRouter);
app.use('/api/rdf/', rdfRouter);
app.use('/api/jsonServer/', jsonServerRouter);

app.get('/', (req, res) => {
  res.send('Proiect Web Semantic - Scridon Lucas, Timandi Sabin');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
