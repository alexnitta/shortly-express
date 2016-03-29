var db = require('../config');
var User = require('../models/user');

var Users = new db.Collection();

Users.model = User;

Users.findUser = function(user) {
  return Users.get(user);
};

module.exports = Users;
