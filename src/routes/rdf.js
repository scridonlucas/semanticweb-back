import { Router, json } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { DataFactory, Writer } from 'n3';

const rdf4jBaseUrl = 'http://localhost:8080/rdf4j-server/repositories';
const repository = 'airports-repo';

const rdfRouter = Router();

const parseJStoRdfTurtle = ({ airportKey, allAirports, flight }) => {
  const airport = allAirports.find((airport) => airport.id === airportKey);
  if (airport) {
    airport.flights.push({
      id: Math.floor(Math.random() * 100 + 1).toString(),
      flightNumber: flight.flightNumber,
      address: flight.arrivalAirport,
      departureTime: flight.departureTime,
    });
    return allAirports;
  } else {
    throw new Error('Airport not found!');
  }
};

const parseRDFtoJSON = (results) => {
  const airports = {};
  results.forEach((result) => {
    const airportId = result.airport.value;
    if (!airports[airportId]) {
      airports[airportId] = {
        id: airportId,
        name: result.name.value,
        iataCode: result.iataCode.value,
        address: {
          locality: result.addressLocality.value,
          country: result.addressCountry.value,
        },
        flights: [],
      };
    }

    airports[airportId].flights.push({
      id: result.flight.value,
      flightNumber: result.flightNumber.value,
      arrivalAirport: result.arrivalAirport.value,
      departureTime: result.departureTime.value,
    });
  });
  return airports;
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
    const parsedData = parseJStoRdfTurtle(formData);
    console.log(parsedData[1].flights);
    const writer = new Writer({
      prefixes: {
        schema: 'http://schema.org/',
        ex: 'http://example.org/',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      },
    });

    parsedData.forEach((airport) => {
      writer.addQuad(
        DataFactory.namedNode(`http://example.org/airport/${airport.id}`),
        DataFactory.namedNode('rdf:type'),
        DataFactory.namedNode('schema:Airport')
      );

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
    res.json('Airports data successfully added to RDF4J server!');
  } catch (error) {
    res.status(500).send('Error while sending data to RDF4J Server!');
  }
});

rdfRouter.get('/', async (req, res) => {
  try {
    const query = `
      PREFIX schema: <http://schema.org/>
      SELECT ?airport ?name ?iataCode ?addressLocality ?addressCountry ?flight ?flightNumber ?arrivalAirport ?departureTime WHERE {
        ?airport a schema:Airport ;
                 schema:name ?name ;
                 schema:iataCode ?iataCode ;
                 schema:addressLocality ?addressLocality ;
                 schema:addressCountry ?addressCountry ;
                 schema:hasFlight ?flight .
        ?flight schema:flightNumber ?flightNumber ;
                schema:arrivalAirport ?arrivalAirport ;
                schema:departureTime ?departureTime .
      }
    `;
    const encodedQuery = encodeURIComponent(query);
    const response = await axios.get(
      `${rdf4jBaseUrl}/${repository}?query=${encodedQuery}`,
      {
        headers: {
          Accept: 'application/sparql-results+json',
        },
      }
    );

    const results = response.data.results.bindings;
    if (results.length === 0) {
      res.status(500).send('Failed to gather data from RDF4J Server!');
    }
    const airports = parseRDFtoJSON(results);
    console.log(Object.values(airports));
    res.json(Object.values(airports));
  } catch (error) {
    res.status(500).send('Failed to gather data from RDF4J Server!');
  }
});

export default rdfRouter;
