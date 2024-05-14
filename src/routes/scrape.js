import { Router, json } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const scrapeRouter = Router();
const url = 'http://localhost:3001/json-ld/';

function parseData(jsonData) {
  const parsedData = jsonData['@graph'].map((flight) => ({
    id: flight.flightNumber,
    airport: {
      name: flight.airport.name,
      address: {
        addressLocality: flight.airport.address.addressLocality,
        country: flight.airport.address.addressCountry,
      },
    },
    arrivalAirport: flight.arrivalAirport,
    departureTime: flight.departureTime,
  }));
  return parsedData;
}

scrapeRouter.get('/', async (_req, res) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const jsonLdScript = $('#scriptjsonld').html();
    if (jsonLdScript) {
      const jsonData = JSON.parse(jsonLdScript);
      const parsedData = parseData(jsonData);
      res.json(parsedData);
    } else {
      res.status(404).json({ error: 'No JSON-LD found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default scrapeRouter;
