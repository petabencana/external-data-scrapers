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

  console.log('VolcanoDataSource > poll > fetchResults: Loading API')
  var responseData = "";
  var requestURL = options;
  var volcanoDataSource;
  var volcanoDataFiltered;
  var volcanoDatatoInsert = new Array();
  var volcanoDatatoUpdate = new Array();

    var requestAPI = https.request( requestURL , function(responseAPI) {
      responseAPI.setEncoding('utf8');

      responseAPI.on('data', function (chunk) {
        responseData += chunk;
      });

      responseAPI.on('end', function() {
        try {
          volcanoDataSource = JSON.parse( responseData );
          for(let i = 0; i < volcanoDataSource.length; i++) {
            volcanoDataFiltered = _filterResults(volcanoDataSource[i]);
            if (volcanoDataFiltered == 0){
            //  console.log("Update Data.....");
             volcanoDatatoUpdate.push(volcanoDataSource[i]);
            }else if(volcanoDataFiltered == 1){
              // console.log("Insert Data.....");
              volcanoDatatoInsert.push(volcanoDataSource[i]);
            }
          }

          //for insert data volcano
          if (volcanoDatatoInsert.length > 0) {
            console.log("VolcanoDataSource > poll > processResult: Processing insert");
            _processResult(volcanoDatatoInsert);
          } else {
            console.log("VolcanoDataSource > poll > processResult: There is no data to be insert");
          }
          
          //for update data volcano
          if (volcanoDatatoUpdate.length > 0) {
            console.log("VolcanoDataSource > poll > updateResult: Processing update");
            _updateResult(volcanoDatatoUpdate);
          } else {
            console.log("VolcanoDataSource > poll > updateResult: There is no data to be updated");
          }

          
        } catch (e) {
            console.log( " VolcanoDataSource > poll > fetchResults: Error parsing JSON" );
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
      var datetime =  Date.parse(volcanoData.laporan_terakhir.tanggal.split(' ')[5]) / 1000;

      if ( _lastContributionTime[volcanoData.gunung_api.code]){
          if ( datetime < _lastContributionTime[volcanoData.gunung_api.code] ) {
            // We've seen this result before, check the next volcano
            console.log("VolcanoDataSourcee > poll > processResults: Found already processed result with time: " + volcanoData.laporan_terakhir.tanggal);
            return -1;
          }
          // else if ( datetime < new Date().getTime() - config.volcano.historicalLoadPeriod ) {
          //   // This result is older than our cutoff, check the next volcano
          //   console.log("VolcanoDataSource > poll > processResults: Result : " +  result.DateTime + " older than maximum configured age of " + config.volcano.historicalLoadPeriod / 1000 + " seconds");
          // } 
          else {
            // Process this result
            console.log("VolcanoDataSource > poll > processResults: Processing result , " + volcanoData.laporan_terakhir.tanggal);
            _lastContributionTime[volcanoData.gunung_api.code] = datetime
            // _updateResult( volcanoData, 
            //   function () {
            //     console.log('Logged confirmed volcano report');
            //   } );
            return 0;
          }
        } else {
          // _processResult( volcanoData,
          //   function (){
          //     console.log('Insert data to Database');
          //   });
          return 1;
        }
      }
    
    function _processResult(volcanoDatatoInsert){
      volcanoDatatoInsert.forEach(function(vonaReport){
      var measuredatetime = Date.parse(vonaReport.laporan_terakhir.tanggal.split(' ')[5])/1000;
        sql = {
            text: "INSERT INTO " + config.volcano.pg.list_volcano + " " +
                "(volcano_code, volcano_name, volcano_description, volcano_status, coordinat_latitude, coordinat_longitude, report_noticenumber, report_date, report_made_by, visual_description, visual_others, visual_photo, climatology_description, earthquake_description, earthquake_chart, earthquake_recommendation, url, share_url, share_description, share_photo, measuredatetime) " +
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
      });
    }


    function _updateResult(volcanoDatatoUpdate){
      volcanoDatatoUpdate.forEach(function(vonaReport){
      var measuredatetime = Date.parse(vonaReport.laporan_terakhir.tanggal.split(' ')[5])/1000;
        sql = {
            text: "UPDATE " + config.volcano.pg.list_volcano + " SET " +
                "volcano_code = $1, " +
                "volcano_name = $2, " +
                "volcano_description = $3, " +
                "volcano_status = $4, " +
                "coordinat_latitude = $5, " +
                "coordinat_longitude = $6, " +
                "report_noticenumber = $7, " +
                "report_date = $8, " +
                "report_made_by = $9, " +
                "visual_description = $10, " +
                "visual_others = $11, " +
                "visual_photo = $12, " +
                "climatology_description = $13, " +
                "earthquake_description = $14, " + 
                "earthquake_chart = $15, " +
                "earthquake_recommendation = $16, " +
                "url = $17, " + 
                "share_url = $18, " +
                "share_description = $19, " +
                "share_photo = $20, " +
                "measuredatetime = $21 " + "WHERE volcano_code = $22;",
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
                    vonaReport.gunung_api.code,
                  ]
              };
      dbQuery(sql);
     });
    }

    function _getLastDataFromDatabase(){
      console.log("Updating last contribution data from Database..")
    
      sql = {
        text: "SELECT volcano_code, measuredatetime as epoch FROM " + config.volcano.pg.list_volcano + ";"
      }
      response = dbQuery(sql, 
        function ( lastestData ) {
          if (lastestData && lastestData.rows && lastestData.rows.length > 0){
            for(let i = 0; i < lastestData.rows.length; i++){
              _lastContributionTime[lastestData.rows[i].volcano_code] = lastestData.rows[i].epoch
            }
            console.log('Set last observation times from database, datetime: ' + _lastContributionTime);
          }
          else {
            console.log('Error setting last observation time from database (is the reports table empty?)');
          }
        }
      );
      _fetchResults();
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
          console.log( "dbQuery: success ");
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
_getLastDataFromDatabase();