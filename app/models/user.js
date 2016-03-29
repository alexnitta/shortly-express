var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

// Promise.promisifyAll(bcrypt);

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  
  hashPassword: function(model, attrs, options) {
    var hashAsync = Promise.promisify(bcrypt.hash); 
    return hashAsync(model.attributes.password, null, null)
      .then(function(hash) {
        model.set('password', hash);
      })
      .catch(function(err) {
        console.log('Oops, caught an error: ', err.message);  
      });
  }
});



module.exports = User;