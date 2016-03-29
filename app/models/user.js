var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

Promise.promisifyAll(bcrypt);

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    // console.log('password from closure?:', req.body.password );
    this.on('creating', this.hashPassword, this);
  },
  
  hashPassword: function(model, attrs, options) {
    return bcrypt.genSaltAsync(10)
    .then(function(salt) {
      return bcrypt.hashAsync(attrs.password, salt, null);
    })
    .then(function(hash) {
      model.set('password', hash);
    })
    .catch(function(err) {
      console.log('Oops, caught an error: ', err.message);
    });    

  }
});



module.exports = User;