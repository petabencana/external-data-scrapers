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

  console.log('VolcanoDataSource > poll > fetchResults: Loading API')
    var responseData = "";
    var requestURL = options;
    var volcanoDataSource;
    var volcanoDataFiltered = new Array();
    // console.log(requestURL);
    var requestAPI = https.request( requestURL , function(responseAPI) {
      responseAPI.setEncoding('utf8');

      responseAPI.on('data', function (chunk) {
        responseData += chunk;
      });

      responseAPI.on('end', function() {
        try {
            volcanoDataSource = JSON.parse( responseData );
            volcanoDataFiltered = _filterResults(volcanoDataSource.data);
            if (volcanoDataFiltered.length > 0) {
              console.log("VolcanoDataSource > poll > processResults: Processing result");
              _processResult(volcanoDataFiltered);
            } else {
              console.log("VolcanoDataSource > poll > processResults: There is no data to be processed");
            }
        } catch (e) {
            console.log( " VolcanoDataSource > poll > fetchResults: Error parsing JSON: " + responseData );
            return;
        }
            console.log('VolcanoDataSource > poll > fetchResults: ' + responseData.length + " bytes");
          });
      });

      requestAPI.on('error', function(error) {
        console.log( "VolcanoDataSource > poll > fetchResults: Error fetching data, " + error.message + ", " + error.stack );
      });
    requestAPI.end();
    return;
    }

    function _filterResults(volcanoData) {
      console.log("filtering results...");
      var volcanoDataFiltered = new Array();
      // console.log(volcanoDataSource);
      // For each result:
          if ( Date.parse(volcanoData.local_date) / 1000 <= _lastContributionTime) {
            // We've seen this result before, check the next volcano
            console.log("VolcanoDataSource > poll > processResults: Found already processed result with time: " + volcanoData.local_date);
          // } else if ( Date.parse(result.DateTime) < new Date().getTime() - config.volcano.historicalLoadPeriod ) {
          //   // This result is older than our cutoff, check the next volcano
          //   console.log("VolcanoDataSource > poll > processResults: Result : " +  result.DateTime + " older than maximum configured age of " + config.volcano.historicalLoadPeriod / 1000 + " seconds");
          } else {
            // Process this result
            console.log("VolcanoDataSource > poll > processResults: Processing result , " + volcanoData.local_date);
            _lastContributionTime = Date.parse(volcanoData.local_date)/1000;
            volcanoDataFiltered.push(volcanoData);
            // _processResult( volcanoData, 
            //   function () {
            //     console.log('Logged confirmed volcano report');
            //   } );
          }
          return volcanoDataFiltered;
      }

    function _processResult(volcanoDataFiltered){
        volcanoDataFiltered.forEach(function(vonaReport){
        sql = {
            text: "INSERT INTO " + config.volcano.pg.lastest_eruption + " " +
                "(volcano_code, volcano_name, latitude, longitude, elevation, local_date, local_time, local_datetime, time_zone, iso_datetime, photo_, activity_level, visual, instrumental, reporter, share_url, share_description, share_photo, measuredatetime) " +
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
    });
  }


    function _getLastDataFromDatabase(){
      console.log("Updating last contribution data from Database..")
    
      sql = {
        text: "SELECT id, measuredatetime as epoch FROM " + config.volcano.pg.lastest_eruption + " ORDER BY measuredatetime DESC;"
      }
      response = dbQuery(sql, 
        function ( lastestData ) {
          if (lastestData && lastestData.rows && lastestData.rows.length > 0){
            _lastContributionTime = lastestData.rows[0].epoch
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
      client.query(sql,(error,result) => {
          if (!error){
          console.log( "dbQuery: success " );
          if (success) {
              try {
                  success(result);
              } catch(error) {
                  console.log("dbQuery: Error in success callback: " + error.message + ", " + error.stack);
              }
          }
          } else {
          console.log(error.stack);
          }
      });
  
    client.end;
  }

_connectDatabase();
_getLastDataFromDatabase()
_fetchResults();