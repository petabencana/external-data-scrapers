const https = require('https');
const {Client} = require('pg');
var path = require('path');

// Verify expected arguments and get config
if (process.argv[2]) {
    var config = require( __dirname + path.sep + process.argv[2] );
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

function _connectDatabase(){
    client.connect(function(err) {
        if (err) throw err;
        console.log("Database Connected");
    });
}

function dbQuery(sql,success) {
    client.query(sql,(err,res) => {
        if (!err){
        console.log( "dbQuery: success: " + JSON.stringify(config) );
        if (success) {
            try {
                success(res);
            } catch(error) {
                console.log("dbQuery: Error in success callback: " + error.message + ", " + error.stack);
            }
        }
        } else {
        console.log(err.stack);
        }
    });

    client.end;
}

_connectDatabase();
_fetchResults();