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
    path: '/api/v1/magma-var',
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
        // console.log('masuk');
        response += chunk;
      });

      res.on('end', function() {
        var responseObject;
        try {
            responseObject = JSON.parse( response );
            for(let i = 0; i < responseObject.length; i++) {
              _filterResults(responseObject[i]);
            }
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
      // console.log(results);
      var result = results;
      var datetime =  Date.parse(result.laporan_terakhir.tanggal.split(' ')[5]) / 1000;
          console.log(result)
          if ( datetime < _lastContributionTime[result.gunung_code] ) {
            // We've seen this result before, check the next volcano
            console.log("VolcanoDataSourcee > poll > processResults: Found already processed result with time: " + result.laporan_terakhir.tanggal);
          } else if ( datetime < new Date().getTime() - config.volcano.historicalLoadPeriod ) {
            // This result is older than our cutoff, check the next volcano
            console.log("VolcanoDataSource > poll > processResults: Result : " +  result.DateTime + " older than maximum configured age of " + config.volcano.historicalLoadPeriod / 1000 + " seconds");
          } else {
            // Process this result
            console.log("VolcanoDataSource > poll > processResults: Processing result , " + result.laporan_terakhir.tanggal);
            _lastContributionTime = datetime;
            _processResult( result, 
              function () {
                console.log('Logged confirmed volcano report');
              } );
          }
      }
    
    function _processResult(vonaReport){
      var measuredatetime = Date.parse(vonaReport.laporan_terakhir.tanggal.split(' ')[5])/1000;
        sql = {
            text: "INSERT INTO " + config.volcano.pg.list_volcano + " " +
                "(gunung_code, gunung_nama, gunung_deskripsi, gunung_status, koordinat_latitude, koordinat_longitude, laporan_noticenumber, laporan_tanggal, laporan_dibuat_oleh, visual_deskripsi, visual_lainnya, visual_foto, klimatologi_deskripsi, gempa_deskripsi, gempa_grafik, gempa_rekomendasi, url, share_url, share_description, share_photo, measuredatetime) " +
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
                "$18," +
                "$19, " +
                "$20, " +
                "$21 " +
                  ");",
                values : [
                    vonaReport.gunung_api.code,
                    vonaReport.gunung_api.nama,
                    vonaReport.gunung_api.deskripsi,
                    vonaReport.gunung_api.status,
                    vonaReport.gunung_api.koordinat.latitude,
                    vonaReport.gunung_api.koordinat.longitude,
                    vonaReport.laporan_terakhir.noticenumber,
                    vonaReport.laporan_terakhir.tanggal,
                    vonaReport.laporan_terakhir.dibuat_oleh,
                    vonaReport.laporan_terakhir.visual.deskripsi,
                    vonaReport.laporan_terakhir.visual.lainnya,
                    vonaReport.laporan_terakhir.visual.foto,
                    vonaReport.laporan_terakhir.klimatologi.deskripsi,
                    vonaReport.laporan_terakhir.gempa.deskripsi,
                    vonaReport.laporan_terakhir.gempa.grafik,
                    vonaReport.laporan_terakhir.rekomendasi,
                    vonaReport.url,
                    vonaReport.share.url,
                    vonaReport.share.description,
                    vonaReport.share.photo,
                    measuredatetime,
                  ]
              };
      dbQuery(sql);
    }


    function _getLastDataFromDatabase(){
      console.log("Updating last contribution data from Database..")
    
      sql = {
        text: "SELECT gunung_code, measuredatetime as epoch FROM " + config.volcano.pg.list_volcano + ";"
      }
      response = dbQuery(sql, 
        function ( result ) {
          if (result && result.rows && result.rows.length > 0){
            for(let i = 0; i < result.rows.length; i++){
              _lastContributionTime[result.rows[i].gunung_code] = result.rows[i].epoch
            }
            console.log('Set last observation times from database, datetime: ' + _lastContributionTime);
            // console.log(_lastContributionTime);
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
_fetchResults();