var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    // console.log('password from closure?:', req.body.password );
    this.on('creating', this.hashPassword, this);
  },
    
  hashPassword: function(model, attrs, options) {
    return new Promise(function(resolve, reject) {
      // create a salt with bcrypt.genSaltSync(10);
      var salt = bcrypt.genSaltSync(10);
      // create a hash with bcrypt.hashSync(password, salt);
      bcrypt.hash(attrs.password, salt, null, function(err, hash) {
        if (err) {
          reject (err);
        }
        model.set('password', hash);
        model.set('salt', salt);
        resolve(hash);
      });
    });

    // console.log('model: ', model);
    // console.log('attrs: ', attrs);
      // get password attribute passed in
      // var password = attrs.password;
      // create a salt with bcrypt.genSaltSync(10);
      // create a hash with bcrypt.hashSync(password, salt);
      // var shasum = crypto.createHash('sha1');
      // shasum.update(model.get('url'));
      // model.set('code', shasum.digest('hex').slice(0, 5));
  }
});



module.exports = User;