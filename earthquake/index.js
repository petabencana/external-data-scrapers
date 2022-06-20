const https = require('https');
var path = require('path');

// Verify expected arguments and get config
if (process.argv[2]) {
    var config = require( __dirname + path.sep + process.argv[2] );
  } else {
      throw new Error('No config file. Usage: node index.js config.js');
  }

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

  _fetchResults();