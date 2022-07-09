'use strict';
require('dotenv').config();


/**
 * Configuration for cognicity-reports-volcano
 * @namespace {object} config
 * @property {object} volcano Configuration object for volcano web service interface
 * @property {string} volcano.serviceURL The URL for the volcano web service
 * @property {number} volcano.historicalLoadPeriod Maximum age in milliseconds of reports which will be processed
 * @property {object} dims.pg Postgres configuration
 * @property {string} dims.pg.lastest_vona Database table to store volcano reports in
 * @property {string} volcano.pg.lastest_eruption Table for last-eruption
 * @property {string} volcano.pg.list_volcano Table for lis-volcano
 * @property {string} volcano.access_token_key Take from the twitter dev admin interface
 */
var config = {};

// volcano web service API
config.volcano = {};
config.volcano.access_token_key = process.env.VOLCANO_TOKEN_KEY;
// config.volcano.serviceURL = 'https://magma.esdm.go.id/api/v1/home/gunung-api/informasi-letusan/latest'
config.volcano.historicalLoadPeriod = 1000 * 60 * 720; // E.g. 1000 * 60 * 120 = 2 hours

// volcano configuration for cognicity-schema
config.volcano.pg = {};
config.volcano.pg.lastest_eruption = 'public.lastest_eruption';
config.volcano.pg.list_volcano = 'public.list_volcano';

// Postgres database connection
config.pg = {};
config.pg.PGPASSWORD = process.env.PGPASSWORD;
config.pg.PGHOST = process.env.PGHOST;
config.pg.PGPORT = process.env.PGPORT;
config.pg.PGUSER = process.env.PGUSER;
config.pg.PGDATABASE = process.env.PGDATABASE;
config.pg.reconnectionDelay = 1000 * 60 * 3; // Delay before attempting a reconnection in ms
config.pg.reconnectionAttempts = 5; // Number of times to attempt reconnection before notifying admin and exiting

module.exports = config;