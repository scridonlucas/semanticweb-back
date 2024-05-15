import { Router, json } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const rdfRouter = Router();
const parseData = ({ airportKey, allAirports, flight }) => {
  const airport = allAirports.find((airport) => airport.id === airportKey);
  if (airport) {
    airport.flights.push({
      id: (airport.flights.length + 1).toString(),
      flightNumber: flight.flightNumber,
      arrivalAirport: flight.arrivalAirport,
      departureTime: flight.departureTime,
    });
    return allAirports;
  } else {
    throw new Error('Airport not found!');
  }
};

rdfRouter.post('/', async (req, res) => {
  const formData = req.body;
  if (!formData) {
    res.status(404).json({ error: 'No data found!' });
  }

  const parsedData = parseData(formData);
  console.log(parsedData);
  res.send('Data successfully received by server!');
});

export default rdfRouter;
