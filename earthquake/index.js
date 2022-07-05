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
    var response = "";

    // console.log(requestURL)

    var req = https.request( requestURL , function(res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
        response += chunk;
        });

        res.on('end', function() {
        var responseObject;
        try {
            responseObject = JSON.parse( response );
            _filterResults(responseObject);
        } catch (e) {
            console.log( "EarthquakeDataSource > poll > fetchResults: Error parsing JSON: " + response );
            return;
        }

        console.log('EarthquakeDataSource > poll > fetchResults: ' + response.length + " bytes");
        });
    });

    req.on('error', function(error) {
        console.log( "EarthquakeDataSource > poll > fetchResults: Error fetching data, " + error.message + ", " + error.stack );
    });

    req.end();
}

function _filterResults(results) {
    console.log("filtering results...");
    results = results.Infogempa.gempa.reverse();
  
    // For each result:
    var result = results.shift();
          while( result ) {
        console.log(result)
        if ( Date.parse(result.DateTime) / 1000 <= _lastContributionTime) {
          // We've seen this result before, check the next earthquake
          console.log("EarthquakeDataSource > poll > processResults: Found already processed result with time: " + result.DateTime);
        // } else if ( Date.parse(result.DateTime) < new Date().getTime() - config.earthquake.historicalLoadPeriod ) {
        //   // This result is older than our cutoff, check the next earthquake
        //   console.log("EarthquakeDataSource > poll > processResults: Result : " +  result.DateTime + " older than maximum configured age of " + config.earthquake.historicalLoadPeriod / 1000 + " seconds");
        } else {
          // Process this result
          console.log("EarthquakeDataSource > poll > processResults: Processing result , " + result.DateTime);
          _lastContributionTime = Date.parse(result.DateTime)/1000;
          _processResult( result, 
            function () {
              console.log('Logged confirmed earthquake report');
            } );
        }
        result = results.shift();
    }
}

function _processResult(res){
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
        res.Tanggal,
        res.Jam.split(' ')[0],
        res.DateTime,
        Date.parse(res.DateTime)/1000,
        res.Coordinates,
        res.Lintang,
        res.Bujur,
        res.Magnitude,
        res.Kedalaman,
        res.Wilayah,
        res.Potensi,
        res.Dirasakan,
        res.Shakemap,
      ]
    };
  
    dbQuery(sql);
}

function _getLastDataFromDatabase(){
    console.log("Updating last contribution data from Database..")
  
    sql = {
      text: "SELECT id, measuredatetime as epoch FROM " + config.earthquake.pg.table_earthquake + 
      " ORDER BY measuredatetime DESC;"
    }
    response = dbQuery(sql, 
      function ( result ) {
        if (result && result.rows && result.rows.length > 0){
          _lastContributionTime = result.rows[0].epoch
          console.log('Set last observation times from database, datetime: ' + _lastContributionTime);
        }
        else {
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
    client.query(sql,(error,res) => {
        if (!error){
        console.log( "dbQuery: success: " + JSON.stringify(config) );
        if (success) {
            try {
                success(res);
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