const https = require('https');
const {Client} = require('pg');
const config_path = 'config.js';
var path = require('path');
var _lastContributionTime = {0:0};

// Verify expected arguments and get config
if (process.argv[2]) {
  var config = require( __dirname + path.sep + process.argv[2] );
} else if (config_path){
  var config = require( __dirname + path.sep + config_path );
} else {
	throw new Error('No config file. Usage: node index.js config.js');
}

const client = new Client({
    host: config.pg.PGHOST,
    user: config.pg.PGUSER,
    port: config.pg.PGPORT,
    password: config.pg.PGPASSWORD,
    database: config.pg.PGDATABASE,
})

function _fetchResults(){
    console.log( 'EarthquakeDataSource > poll > fetchResults: Loading API' );

    var requestURL = config.earthquake.serviceURL;
    var responseData = "";
    var earthquakeDataSource;
    var earthquakeDataFiltered = new Array();

    var requestAPI = https.request( requestURL , function(responseAPI) {
        responseAPI.setEncoding('utf8');

        responseAPI.on('data', function (chunk) {
          responseData += chunk;
        });

        responseAPI.on('end', function() {
          try {
              earthquakeDataSource = JSON.parse( responseData );
              earthquakeDataFiltered = _filterResults(earthquakeDataSource);

              if (earthquakeDataFiltered.length > 0) {
                console.log("EarthquakeDataSource > poll > processResults: Processing result");
                _processResults(earthquakeDataFiltered);
              } else {
                console.log("EarthquakeDataSource > poll > processResults: There is no data to be processed");
              }

          } catch (e) {
              console.log( "EarthquakeDataSource > poll > fetchResults: Error processing fetched data: " + responseData );
              return;
          }

          console.log('EarthquakeDataSource > poll > fetchResults: ' + responseData.length + " bytes");
        });
    });

    requestAPI.on('error', function(error) {
        console.log( "EarthquakeDataSource > poll > fetchResults: Error fetching data, " + error.message + ", " + error.stack );
    });

    requestAPI.end();
    return;
}

function _filterResults(earthquakeDataSource) {
    console.log("filtering results...");
    earthquakeDataSource = earthquakeDataSource.Infogempa.gempa.reverse();
    var earthquakeDataFiltered = new Array();
  
    // For each result:
    var earthquakeData = earthquakeDataSource.shift();
    while( earthquakeData ) {

      if ( Date.parse(earthquakeData.DateTime) / 1000 <= _lastContributionTime) {
        // We've seen this result before, check the next earthquake
        console.log("EarthquakeDataSource > poll > processResults: Found already processed result with time: " + earthquakeData.DateTime);
      // } else if ( Date.parse(result.DateTime) < new Date().getTime() - config.earthquake.historicalLoadPeriod ) {
      //   // This result is older than our cutoff, check the next earthquake
      //   console.log("EarthquakeDataSource > poll > processResults: Result : " +  result.DateTime + " older than maximum configured age of " + config.earthquake.historicalLoadPeriod / 1000 + " seconds");
      } else {
        // Process this result
        console.log("EarthquakeDataSource > poll > processResults: Data will be processed, " + earthquakeData.DateTime);
        _lastContributionTime = Date.parse(earthquakeData.DateTime)/1000;
        earthquakeDataFiltered.push(earthquakeData);
      }

      earthquakeData = earthquakeDataSource.shift();
    }

    return earthquakeDataFiltered;
}

function _processResults(earthquakeDataFiltered){
    earthquakeDataFiltered.forEach(function(earthquakeData){
      sql = {
        text: "INSERT INTO " + config.earthquake.pg.table_earthquake + " " +
          "(date, time, datetime, measuredatetime, coordinate, latitude, longitude, magnitude, depth, zone, potential, feltarea, shakemap) " +
          "VALUES (" +
          "$1, " +
          "$2, " +
          "$3, " +
          "$4, " +
          "$5, " +
          "$6, " +
          "$7, " +
          "$8, " +
          "$9, " +
          "$10, " +
          "$11, " +
          "$12, " +
          "$13" +
          ");",
        values : [
          earthquakeData.Tanggal,
          earthquakeData.Jam.split(' ')[0],
          earthquakeData.DateTime,
          Date.parse(earthquakeData.DateTime)/1000,
          earthquakeData.Coordinates,
          earthquakeData.Lintang,
          earthquakeData.Bujur,
          earthquakeData.Magnitude,
          earthquakeData.Kedalaman,
          earthquakeData.Wilayah,
          earthquakeData.Potensi,
          earthquakeData.Dirasakan,
          earthquakeData.Shakemap,
        ]
      };
      dbQuery(sql);
    });
}

function _getLastDataFromDatabase(){
    console.log("Updating last contribution data from Database..")
  
    sql = {
      text: "SELECT id, measuredatetime as epoch FROM " + config.earthquake.pg.table_earthquake + 
      " ORDER BY measuredatetime DESC LIMIT 3;"
    }
    response = dbQuery(sql, 
      function ( latestData ) {
        if (latestData && latestData.rows && latestData.rows.length > 0){
          _lastContributionTime = latestData.rows[0].epoch
          console.log('Set last observation times from database, datetime: ' + _lastContributionTime);
        } else {
          console.log('Error setting last observation time from database (is the reports table empty?)');
        }
      }
    );
}

function _connectDatabase(){
    client.connect(function(error) {
        if (error){
          console.log("_connectDatabase: Error in connecting to database: " + error.message + ", " + error.stack);
          throw error;
        }
        console.log("Database Connected");
    });
}

function dbQuery(sql,success) {
    client.query(sql,(error,result) => {
        if (!error){
        console.log( "dbQuery: success: " + JSON.stringify(config) );
        if (success) {
            try {
                success(result);
            } catch(error) {
                console.log("dbQuery: Error in success callback: " + error.message + ", " + error.stack);
            }
        }
        } else {
          console.log("dbQuery: Error in query sql: " + error.message + ", " + error.stack);
          throw error;
        }
    });

    client.end;
}

_getLastDataFromDatabase();
_connectDatabase();
_fetchResults();