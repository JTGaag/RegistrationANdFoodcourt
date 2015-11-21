exports.cpass = function(id,opass,npass,callback) {

  callback({'response':"Change Password",'res':false});

}
exports.respass_init = function(email,callback) {

  callback({'response':"Reset Password inital",'res':false});

}
exports.respass_chg = function(email,code,npass,callback) {

  callback({'response':"Reset Password change",'res':true});

}
