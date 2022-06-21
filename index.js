const { get } = require('http');
const https = require('https');
const {Client} = require('pg');
var path = require('path');
const { appendFile } = require('fs');

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
            // _filterResults(responseObject);
            console.log(responseObject.data);
            _processResult(responseObject.data);
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

    
    function _processResult(vonaReport){
        sql = {
            text: "INSERT INTO " + config.volcano.pg.lastest_vona + " " +
                "(code_ga, nama_gunung_api, latitude, longitude, elevation, local_date, local_time, local_datetime, time_zone, iso_datetime, foto, tingkat_aktivitas, visual, instrumental, pelapor, url, description, photo) " +
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
                "$18 " +
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
                  ]
              };
      dbQuery(sql);
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