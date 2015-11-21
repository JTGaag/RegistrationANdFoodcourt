var pg = require('pg');
var validation = require('validator');
var crypto = require('crypto');
var rand = require('csprng');
var jwt = require('jsonwebtoken');

var conString = process.env.DATABASE_URL;
var jwt_secret = process.env.JWT_SECRET;

exports.getAllEvents = function(jwt_token, callback){
  var email;
  jwt.verify(jwt_token, jwt_secret, function(err, decoded){
    if(err){//Check for errors
      callback({'response':"Error in jwt verification"+err, 'error':true});
      return;
    }else{
      email = decoded.email;
      console.log("Email: "+decoded.email);

      //If validToken do the opperation

      pg.connect(conString, function(err, client, done){

        var handleError = function(err) {
          if(!err) return false;
          done(client);
          callback({'response':"An error occured"+err, 'error':true, 'errorcode':13});
          console.log("SQL error" + err);
          return true;
        };


        client.query('SELECT id AS person_id FROM person WHERE email = $1', [email], function(err, result) {
          console.log("Did query: "+result);
          if(handleError(err)) return;
          var person_id = result.rows[0].person_id;
          console.log("person_id: "+person_id);

          var query = client.query('SELECT id, title, description, start_time, end_time FROM event WHERE person_id = $1 ORDER BY id', [person_id]);
          //Handling errors
          query.on('error',function(err){
            handleError(err);
          });
          //Handling row
          query.on('row', function(row, result){
            result.addRow(row);
          });

          //Handling end of querry
          query.on('end',function(result){
            callback({'result':result, 'error':false});
            done();
            console.log("Done get all events");
          });

        });
      });

    }
  });
}

exports.createNewEvent = function(jwt_token, title, description, start_time, end_time, callback){

  var email;
  jwt.verify(jwt_token, jwt_secret, function(err, decoded){
    if(err){//Check for errors
      callback({'response':"Error in jwt verification"+err, 'error':true});
      return;
    }else{
      email = decoded.email;
      console.log("Email: "+decoded.email);

      //If validToken do the opperation

      pg.connect(conString, function(err, client, done){

        var handleError = function(err) {
          if(!err) return false;
          done(client);
          callback({'response':"An error occured"+err, 'error':true, 'errorcode':13});
          console.log("SQL error" + err);
          return true;
        };


        client.query('SELECT id AS person_id FROM person WHERE email = $1', [email], function(err, result) {
          console.log("Did query: "+result);
          if(handleError(err)) return;
          var person_id = result.rows[0].person_id;
          console.log("person_id: "+person_id);

          client.query('INSERT INTO event (person_id, title, description, start_time, end_time, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())', [person_id, title, description, start_time, end_time], function(err, result){
            if(handleError(err)) return;
            done();
            callback({'response':"Succefully created new event", 'error':false});
            console.log("Done create event");
          });
        });
      });

    }
  });
}
