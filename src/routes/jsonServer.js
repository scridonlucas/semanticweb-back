import { Router, json } from 'express';
import axios from 'axios';

const jsonServerRouter = Router();

const url = 'http://localhost:4000/airports';

const parseData = (data) => {
  const parsedData = [];
  Object.values(data).forEach((airport) =>
    parsedData.push({
      id: airport.id,
      name: airport.name,
      iataCode: airport.iataCode,
      address: airport.address,
      flights: airport.flights,
    })
  );
  parsedData.pop();
  return parsedData;
};

jsonServerRouter.post('/', async (req, res) => {
  try {
    const data = req.body;
    await axios.post(url, data);
    res.json('JSON Server data successfully gathered.');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

jsonServerRouter.get('/', async (_req, res) => {
  try {
    const response = await axios.get(url);
    const parsedData = parseData(response.data[0]);
    res.send(parsedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default jsonServerRouter;
