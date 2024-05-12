import express from 'express';
import scrapeRouter from './routes/scrape.js';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();

app.use(cors());

app.get('/json-ld/', (req, res) => {
  const rootPath = process.cwd();
  res.sendFile(path.join(rootPath, 'jsonLdHtmlPage', 'index.html'));
});

app.get('/', (req, res) => {
  res.send('Proiect Web Semantic - Scridon Lucas, Timandi Sabin');
});
app.use('/api/scrape/', scrapeRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
