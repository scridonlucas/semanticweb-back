import { Router, json } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { DataFactory, Writer } from 'n3';

const rdf4jBaseUrl = 'http://localhost:8080/rdf4j-server/repositories';
const repository = 'airports-repo';

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

const clearRepository = async () => {
  const clearQuery = `
    CLEAR ALL
  `;
  await axios.post(`${rdf4jBaseUrl}/${repository}/statements`, clearQuery, {
    headers: {
      'Content-Type': 'application/sparql-update',
    },
  });
};

rdfRouter.post('/', async (req, res) => {
  const formData = req.body;
  if (!formData) {
    res.status(404).json({ error: 'No data found!' });
  }
  try {
    await clearRepository();
    const parsedData = parseData(formData);

    const writer = new Writer({
      prefixes: { schema: 'http://schema.org/', ex: 'http://example.org/' },
    });
    parsedData.forEach((airport) => {
      writer.addQuad(
        DataFactory.namedNode(`http://example.org/airport/${airport.id}`),
        DataFactory.namedNode('http://schema.org/name'),
        DataFactory.literal(airport.name)
      );

      writer.addQuad(
        DataFactory.namedNode(`http://example.org/airport/${airport.id}`),
        DataFactory.namedNode('http://schema.org/iataCode'),
        DataFactory.literal(airport.iataCode)
      );

      writer.addQuad(
        DataFactory.namedNode(`http://example.org/airport/${airport.id}`),
        DataFactory.namedNode('http://schema.org/addressLocality'),
        DataFactory.literal(airport.address.locality)
      );

      writer.addQuad(
        DataFactory.namedNode(`http://example.org/airport/${airport.id}`),
        DataFactory.namedNode('http://schema.org/addressCountry'),
        DataFactory.literal(airport.address.country)
      );

      airport.flights.forEach((flight) => {
        writer.addQuad(
          DataFactory.namedNode(`http://example.org/airport/${airport.id}`),
          DataFactory.namedNode('http://schema.org/hasFlight'),
          DataFactory.namedNode(`http://example.org/flight/${flight.id}`)
        );

        writer.addQuad(
          DataFactory.namedNode(`http://example.org/flight/${flight.id}`),
          DataFactory.namedNode('http://schema.org/flightNumber'),
          DataFactory.literal(flight.flightNumber)
        );

        writer.addQuad(
          DataFactory.namedNode(`http://example.org/flight/${flight.id}`),
          DataFactory.namedNode('http://schema.org/arrivalAirport'),
          DataFactory.literal(flight.arrivalAirport)
        );

        writer.addQuad(
          DataFactory.namedNode(`http://example.org/flight/${flight.id}`),
          DataFactory.namedNode('http://schema.org/departureTime'),
          DataFactory.literal(
            flight.departureTime,
            DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')
          )
        );

        writer.addQuad(
          DataFactory.namedNode(`http://example.org/flight/${flight.id}`),
          DataFactory.namedNode('http://schema.org/departureAirport'),
          DataFactory.namedNode(`http://example.org/airport/${airport.id}`)
        );
      });
    });

    const turtleData = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    const response = await axios.post(
      `${rdf4jBaseUrl}/${repository}/statements`,
      turtleData,
      {
        headers: {
          'Content-Type': 'text/turtle',
        },
      }
    );
    console.log('test');
    console.log(response);
    res.json('Airports data successfully added to RDF4J server!');
  } catch (error) {
    res.status(500).send('Error while sending data to RDF4J Server!');
  }
});

export default rdfRouter;
