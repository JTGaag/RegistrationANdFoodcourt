var pg = require('pg');
var validation = require('validator');
var crypto = require('crypto');
var rand = require('csprng');
var jwt = require('jsonwebtoken');

var conString = process.env.DATABASE_URL;


exports.create = function(first_name, last_name, email, pass1, pass2, callback) {
  var validated = true;
  var better_email = email.toLowerCase().trim();
  //Input checks
  if(!validation.isEmail(better_email)){
    validated = false;
    callback({'response':'Not a valid email adress','errorcode':1, 'error':true});
    return;
  }else if(!validation.matches(first_name, /^[a-zA-Z\s\u00C0-\u00FF]+$/)){
    validated = false;
    callback({'response':'Not a valid first name','errorcode':2, 'error':true});
    return;
  }else if(!validation.matches(last_name, /^[a-zA-Z\s\u00C0-\u00FF]+$/)){
    validated = false;
    callback({'response':'Not a valid last name','errorcode':3, 'error':true});
    return;
  }else if(!validation.equals(pass1,pass2)){
    validated = false;
    callback({'response':'Passwords are not the same','errorcode':4, 'error':true});
    return;
  }else if(!validation.matches(pass1,/[a-z]/)){
    validated = false;
    callback({'response':'Passwords need to contain a small letter','errorcode':5, 'error':true});
    return;
  }else if(!validation.matches(pass1,/[A-Z]/)){
    validated = false;
    callback({'response':'Passwords need to contain a Capital letter','errorcode':6, 'error':true});
    return;
  }else if(!validation.matches(pass1,/[0-9]/)){
    validated = false;
    callback({'response':'Passwords need to contain a number','errorcode':7, 'error':true});
    return;
  // }else if(!validation.matches(pass1,/[!,@,#,$,%,^,&,*,?,_,~]/)){
  //   validated = false;
  //   callback({'response':'Passwords need to contain a special character','errorcode':8, 'error':true});
  //   return;
  }else if(!validation.isLength(pass1, 6)){
    validated = false;
    callback({'response':'Passwords need to be at least 6 characters long','errorcode':9, 'error':true});
    return;
  }

  //Only continue when everything is validated
  if(validated){
    //Function to insert new record in person database
    //Perform querry
    pg.connect(conString, function(err, client, done){
      //Do database stuff here

      //Error function
      var handleError = function(err) {
        if(!err) return false;
        done(client);
        callback({'response':"An error occured"+err, 'firstname':first_name, 'lastname':last_name, 'email':better_email, 'error':true, 'errorcode':13});
        return true;
      };

      //First see if no email exist
      client.query('SELECT COUNT(email) AS count FROM person WHERE email = $1',[better_email], function(err, result) {

        // handle an error from the query
        if(handleError(err)) return;

        if(result.rows[0].count!=0){//Same email already used
          done();
          callback({'response':'Email already used','errorcode':10, 'error':true});
          return;
        }else{//Insert new person
          //Hash al the things!
          var salt = rand(160, 36)
          var newPass = salt + pass1;
          var token = crypto.createHash('sha512').update(email + rand).digest("hex");
          var hashed_password = crypto.createHash('sha512').update(newPass).digest("hex");

          //inser new record
          client.query('INSERT INTO person (first_name, last_name, email, token, salt, hashed_password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [first_name, last_name, better_email, token, salt, hashed_password], function(err, result) {
          //client.query('INSERT INTO person (first_name, last_name, email, created_at) VALUES ($1, $2, $3, NOW())', [first_name, last_name, email], function(err, result) {

            // handle an error from the query
            if(handleError(err)) return;

            //Call done to release client
            done();
            callback({'response':"Succefully created", 'firstname':first_name, 'lastname':last_name, 'email':email, 'error':false});

          });
        }

      });

    });
  }
}

exports.showall = function(callback){
  var tmpString = '<table style="width:100%">'+
  '<tr>'+
  '<td><b>Id</b></td>'+
  '<td><b>First</b></td>'+
  '<td><b>Last</b></td>'+
  '<td><b>Email</b></td>'+
  '</tr>';
  //Function to retreive all persons from table
  pg.connect(conString, function(err, client, done){
    var handleError = function(err) {
      if(!err) return false;
      done(client);
      callback({'response':"An error occured"+err, 'error':true, 'errorcode':13});
      return true;
    };

    //Real query
    var query = client.query('SELECT id, first_name, last_name, email FROM person');

    //Handling errors
    query.on('error',function(err){
      handleError(err);
    });
    //Handling row
    query.on('row', function(row, result){
      tmpString = tmpString +
      '<tr>'+
      '<td>'+row.id+'</td>'+
      '<td>'+row.first_name+'</td>'+
      '<td>'+row.last_name+'</td>'+
      '<td>'+row.email+'</td>'+
      '</tr>';
      result.addRow(row);
    });

    //Handling end of querry
    query.on('end',function(result){
      tmpString = tmpString +
      '</table>';
      done();
      callback({'result':result, 'error':false});
    });

  });

}

exports.authenticate = function(email, password, callback){
  //Function to check if user is registered and send correct information
  var better_email = email.toLowerCase().trim();
  //console.log('"'+better_email+'"');
  pg.connect(conString, function(err, client, done){
    var handleError = function(err) {
      if(!err) return false;
      done(client);
      callback({'response':"An error occured"+err, 'error':true, 'errorcode':13});
      return true;
    };

    //Select query to get hashed_password and salt from database
    var query = client.query('SELECT first_name, last_name, email, token, hashed_password, salt FROM person WHERE email = $1', [better_email], function(err, result) {
      // handle an error from the query
      if(handleError(err)) return;
      if(result.rowCount!=1){
        callback({'response':'No user with that email','errorcode':11, 'error':true, 'res':false});
        done();
        return;
      }else{
        var temp_hash = crypto.createHash('sha512').update(result.rows[0].salt + password).digest("hex");
        if(!validation.equals(temp_hash,result.rows[0].hashed_password)){
          callback({'response':'Incorrect password','errorcode':12, 'error':true, 'res':false});
          done();
          return;
        }else{
          var payload = {
            first_name: result.rows[0].first_name,
            last_name: result.rows[0].last_name,
            email: result.rows[0].email,
            token: result.rows[0].token
          };

          var jwt_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresInMinutes: 60*1 });
          console.log("Done authenticate");
          callback({'response':'Yay you did it!', 'error':false, 'res':true, 'jwt_token': jwt_token});
          done();
          return;
        }
      }
      done();

    });




  });
}
