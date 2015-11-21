var pg = require('pg');
var validation = require('validator');
var crypto = require('crypto');
var rand = require('csprng');
var jwt = require('jsonwebtoken');

var conString = process.env.DATABASE_URL;

/*
RESPONSE CODES:
1: adding wifi signal data
2: returning wifi signal data
*/

/*
ERROR CODES:
13: Error with database query
*/

/*
Building codes
1: EWI
2: RDW
*/

exports.add = function(building_id, phone_id, wifi_data_array, callback){

  var jsonObject = JSON.parse(wifi_data_array);

  pg.connect(conString, function(err, client, done){
    var handleError = function(err) {
      if(!err) return false;
      done(client);
      callback({'response_code':1, 'response':"An error occured"+err, 'error':true, 'errorcode':13});
      return true;
    };

    for(var i=0; i<jsonObject.length; i++){
      var wifi_obj = jsonObject[i];
      var wifi_list = JSON.stringify(wifi_obj['wifi_list']);
      var x_pos = wifi_obj['x_pos'];
      var y_pos = wifi_obj['y_pos'];

      var query = client.query('INSERT INTO wifi (building_id, phone_id, x_position, y_position, wifi_list, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())', [building_id, phone_id, x_pos, y_pos, wifi_list], function(err, result){
        if(handleError(err)) return;

      });
    }

    done();
    callback({'response_code':1, 'response':"Succefully inserted wifi data",'error':false});


  });
}

exports.showforbuilding = function(building_id, callback){
  pg.connect(conString, function(err, client, done){
    var handleError = function(err) {
      if(!err) return false;
      done(client);
      callback({'response_code':2, 'response':"An error occured"+err, 'error':true, 'errorcode':13});
      return true;
    };
    var arrayResult = [];
    var query = client.query('SELECT * FROM wifi WHERE building_id = $1', [building_id]);

    //Handling errors
    query.on('error', function(err){
      handleError(err);
    });

    //Handling rows
    query.on('row', function(row, result){
      arrayResult.push({'phone_id':row.phone_id, 'x_position':row.x_position, 'y_position':row.y_position, 'wifi_list':row.wifi_list.replace(/\\\"/g, '"').replace(/\"/g, '"')});
    });

    //Handling end
    query.on('end', function(result){
      done();
      callback({'response_code':2, 'error':false, 'response':arrayResult});
    });

  });
}
