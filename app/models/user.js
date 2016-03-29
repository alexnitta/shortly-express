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

    // return new Promise(function(resolve, reject) {
    //   // create a salt with bcrypt.genSaltSync(10);
    //   // create a hash with bcrypt.hashSync(password, salt);
    //   // var salt = bcrypt.genSaltSync(10, function(err, salt));
    //   var salt = '12356912348';
    //   bcrypt.hash(attrs.password, salt, null, function(err, hash) {
    //     if (err) {
    //       reject (err);
    //     }
    //     model.set('password', hash);
    //     model.set('salt', salt);
    //     resolve(hash);
    //   });
    // });
  }
});



module.exports = User;