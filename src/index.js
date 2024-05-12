import express from 'express';
import scrapeRouter from './routes/scrape.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.get('/', (req, res) => {
  res.send('Proiect Web Semantic - Scridon Lucas, Timandi Sabin');
});
app.use('/api/scrape/', scrapeRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
