var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  link: function() {
    return this.hasMany(Link, 'link_id');
  },

  initialize: function(loginDetails) {
    this.on('creating', function(model, attrs, options) {
      // var salt = bcrypt.genSaltSync(10);
      // var hash = bcrypt.hashSync(loginDetails.password, salt);
      model.set('password', loginDetails.password);
      // model.set('salt', salt);
      // model.set('hashedpw', hash);
      model.set('username', loginDetails.username);
    });
  }
});

module.exports = User;