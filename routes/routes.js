var chgpass = require('../modules/config/chgpass');
var register = require('../modules/config/register');
var login = require('../modules/config/login');
var person = require('../modules/config/person');
var events = require('../modules/config/event');
var wifi = require('../modules/config/wifi');

module.exports = function(app) {


  /*
  All WIfi releated stuff for smartphone sensing course
  */
  app.post('/wifi/addwifidata', function(req, res){
    var building_id = req.body.building_id;
    var phone_id = req.body.phone_id;
    var wifi_data_array = req.body.wifi_data_array;


    wifi.add(building_id, phone_id, wifi_data_array, function (found) {
      console.log(found);
      res.json(found);
    });
  });

  app.post('/wifi/showforbuilding', function(req, res){
    var building_id = req.body.building_id;

    wifi.showforbuilding(building_id,function (found) {
      console.log(found);
      res.json(found);
    });

  });

  app.get('/wifi/showwifi', function(req, res){
    var body = '<html>'+
  	'<head>'+
  	'<meta http-equiv="Content-Type" '+
  	'content="text/html; charset=UTF-8" />'+
  	'</head>'+
  	'<body>'+
  	'<form action="/wifi/showforbuilding" method="post">'+
    'Building id: <br>'+
  	'<input type="text" name="building_id" value="1">'+
  	'<br>'+
  	'<input type="submit" value="Submit" />'+
  	'</form>'+
  	'</body>'+
  	'</html>';
    res.end(body)
  });


  /*
  Index of app
  */
  app.get('/', function(req, res) {
    res.end("Node-Android-Project");
  });

  /*
  Login pages
  */
  app.get('/login',function(req,res){
    var body = '<html>'+
  	'<head>'+
  	'<meta http-equiv="Content-Type" '+
  	'content="text/html; charset=UTF-8" />'+
  	'</head>'+
  	'<body>'+
  	'<form action="/login" method="post">'+
    'Enter email adres: <br>'+
  	'<input type="text" name="email" value="email@example.com">'+
  	'<br>'+
  	'Enter password: <br>'+
  	'<input type="password" name="password" value=""/>'+
  	'<br>'+
  	'<input type="submit" value="Submit" />'+
  	'</form>'+
  	'</body>'+
  	'</html>';
    res.end(body)
  });

  app.post('/login',function(req,res){
    var email = req.body.email;
    var password = req.body.password;

    person.authenticate(email,password,function (found) {
      console.log(found);
      res.json(found);
    });

  });

  /*
  Register pages
  */
  app.get('/register',function(req,res){
    res.end("Register Page get")
  });

  app.post('/register',function(req,res){
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var email = req.body.email;
    var pass1 = req.body.password1;
    var pass2 = req.body.password2;

    person.create(first_name,last_name,email,pass1,pass2,function (found) {
      console.log(found);
      res.json(found);
    });

  });

  /*
  Add person pages
  */
  app.get('/person',function(req,res){
    var body = '<html>'+
  	'<head>'+
  	'<meta http-equiv="Content-Type" '+
  	'content="text/html; charset=UTF-8" />'+
  	'</head>'+
  	'<body>'+
  	'<form action="/person" method="post">'+
    'First name: <br>'+
  	'<input type="text" name="first_name" value="Firstname">'+
  	'<br>'+
    'Last name: <br>'+
  	'<input type="text" name="last_name" value="Lastname">'+
  	'<br>'+
    'Enter email adres: <br>'+
  	'<input type="text" name="email" value="email@example.com">'+
  	'<br>'+
    'Enter password: <br>'+
    '<input type="text" name="password1" >'+
  	'<br>'+
    'Repeat password: <br>'+
    '<input type="text" name="password2" >'+
  	'<br>'+
  	'<input type="submit" value="Submit" />'+
  	'</form>'+
  	'</body>'+
  	'</html>';
    res.end(body)
  });

  app.post('/person',function(req,res){
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var email = req.body.email;
    var pass1 = req.body.password1;
    var pass2 = req.body.password2;

    person.create(first_name,last_name,email,pass1,pass2,function (found) {
      console.log(found);
      res.json(found);
    });

  });

  app.get('/allpersons',function(req,res){
    person.showall(function(result){
      res.json(result);
    });
  });

  /*
  All event related things
  */
  app.post('/showevents', function(req, res){
    events.getAllEvents(req.body.jwt_token, function(result){
      res.json(result);
    });
  });

  app.post('/createnewevent', function(req, res){
    var jwt_token = req.body.jwt_token;
    var eventTitle = req.body.eventTitle;
    var eventDescription = req.body.eventDescription;
    var eventStart = req.body.eventStart;
    var eventEnd = req.body.eventEnd;

    events.createNewEvent(jwt_token, eventTitle, eventDescription, eventStart, eventEnd, function(result){
      res.json(result);
    });
  });

  /*
  Password pages
  */
  app.post('/api/chgpass', function(req, res) {
    var id = req.body.id;
    var opass = req.body.oldpass;
    var npass = req.body.newpass;

    chgpass.cpass(id,opass,npass,function(found){
      console.log(found);
      res.json(found);
    });

  });

  app.post('/api/resetpass', function(req, res) {
    var email = req.body.email;

    chgpass.respass_init(email,function(found){
      console.log(found);
      res.json(found);
    });

  });

  app.post('/api/resetpass/chg', function(req, res) {
    var email = req.body.email;
    var code = req.body.code;
    var npass = req.body.newpass;

    chgpass.respass_chg(email,code,npass,function(found){
      console.log(found);
      res.json(found);
    });

  });

};
