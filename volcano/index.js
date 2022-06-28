const { get } = require('http');
const https = require('https');
const {Client} = require('pg');
var path = require('path');
const { appendFile } = require('fs');
var _lastContributionTime = {0:0};

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
    database: config.pg.PGDATABASE
  })

const token = config.volcano.access_token_key;

const options = {
    hostname: 'magma.esdm.go.id',
    port: 443,
    path: '/api/v1/home/gunung-api/informasi-letusan/latest',
    method: 'GET',
    headers: {
        Authorization: 'Bearer' + token
    }
};

function _fetchResults(){

  console.log(options)
    var response = "";

    var req = https.request( options , function(res) {
      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        console.log('masuk');
        response += chunk;
      });

      res.on('end', function() {
        var responseObject;
        try {
            responseObject = JSON.parse( response );
            console.log(responseObject.data);
            _filterResults(responseObject.data);
            // _processResult(responseObject.data);
        } catch (e) {
            console.log( " VolcanoDataSource > poll > fetchResults: Error parsing JSON: " + response );
            return;
        }
            console.log('VolcanoDataSource > poll > fetchResults: ' + response.length + " bytes");
          });
      });

      req.on('error', function(error) {
        console.log( "VolcanoDataSource > poll > fetchResults: Error fetching data, " + error.message + ", " + error.stack );
      });
    req.end();
    }

    function _filterResults(results) {
      console.log("filtering results...");
      results = results;
      console.log(results);
    
      // For each result:
      var result = results;
      console.log(result.local_date)
          if ( Date.parse(result.local_date) / 1000 <= _lastContributionTime) {
            // We've seen this result before, check the next volcano
            console.log("VolcanoDataSource > poll > processResults: Found already processed result with time: " + result.local_date);
          // } else if ( Date.parse(result.DateTime) < new Date().getTime() - config.earthquake.historicalLoadPeriod ) {
          //   // This result is older than our cutoff, check the next volcano
          //   console.log("VolcanoDataSource > poll > processResults: Result : " +  result.DateTime + " older than maximum configured age of " + config.earthquake.historicalLoadPeriod / 1000 + " seconds");
          } else {
            // Process this result
            console.log("VolcanoDataSource > poll > processResults: Processing result , " + result.local_date);
            _lastContributionTime = Date.parse(result.local_date)/1000;
            _processResult( result, 
              function () {
                console.log('Logged confirmed earthquake report');
              } );
          }
      }

    function _processResult(vonaReport){
        sql = {
            text: "INSERT INTO " + config.volcano.pg.lastest_vona + " " +
                "(code_ga, nama_gunung_api, latitude, longitude, elevation, local_date, local_time, local_datetime, time_zone, iso_datetime, foto, tingkat_aktivitas, visual, instrumental, pelapor, url, description, photo, measuredatetime) " +
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
                "$13, " +
                "$14, " +
                "$15, " +
                "$16, " +
                "$17, " +
                "$18, " +
                "$19 " +
                  ");",
                values : [
                    vonaReport.code_ga,
                    vonaReport.nama_gunung_api,
                    vonaReport.latitude,
                    vonaReport.longitude,
                    vonaReport.elevation,
                    vonaReport.local_date,
                    vonaReport.local_time,
                    vonaReport.local_datetime,
                    vonaReport.time_zone,
                    vonaReport.iso_datetime,
                    vonaReport.foto,
                    vonaReport.tingkat_aktivitas,
                    vonaReport.deskripsi.visual,
                    vonaReport.deskripsi.instrumental,
                    vonaReport.pelapor,
                    vonaReport.share.url,
                    vonaReport.share.description,
                    vonaReport.share.photo,
                    Date.parse(vonaReport.local_date)/1000,
                  ]
              };
      dbQuery(sql);
    }


    function _getLastDataFromDatabase(){
      console.log("Updating last contribution data from Database..")
    
      sql = {
        text: "SELECT id, measuredatetime as epoch FROM " + config.volcano.pg.lastest_vona + " ORDER BY measuredatetime DESC;"
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
_getLastDataFromDatabase()
// _connectDatabase();
_fetchResults();