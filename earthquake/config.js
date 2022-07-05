'use strict';
require('dotenv').config();


/**
 * Configuration for cognicity-reports-earthquake
 * @namespace {object} config
 * @property {object} earthquake Configuration object for earthquake web service interface
 * @property {string} earthquake.serviceURL The URL for the earthquake web service
 * @property {number} earthquake.historicalLoadPeriod Maximum age in milliseconds of reports which will be processed
 * @property {object} dims.pg Postgres configuration
 * @property {string} dims.pg.table_earthquake Database table to store earthquake reports in
 */
var config = {};

// Earthquake web service API
config.earthquake = {};
config.earthquake.serviceURL = 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'
config.earthquake.historicalLoadPeriod = 1000 * 60 * 1440; // E.g. 1000 * 60 * 120 = 2 hours

// Earthquake configuration for cognicity-schema
config.earthquake.pg = {};
config.earthquake.pg.table_earthquake = 'public.earthquakes_reports';

// Postgres database connection
config.pg = {};
config.pg.PGPASSWORD = process.env.PGPASSWORD;
config.pg.PGHOST = process.env.PGHOST
config.pg.PGPORT = process.env.PGPORT
config.pg.PGDATABASE = process.env.PGDATABASE
config.pg.reconnectionDelay = 1000 * 60 * 3; // Delay before attempting a reconnection in ms
config.pg.reconnectionAttempts = 5; // Number of times to attempt reconnection before notifying admin and exiting

module.exports = config;