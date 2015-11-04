var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  link: function() {
    return this.hasMany(Link, 'link_id');
  },

  hashPassword: function(model, attrs, options){
    var bcryptPromise = Promise.promisify(brcypt.hash);
    
    return bcryptPromise(model.attributes.password, null, null)
          .then(function(hash){
            model.set('password', hash);
          }); 
  },

  compareHashPassword: function(password, cb){
    bcrypt.compare(password, this.get('password'), function(err, isMatched){
      cb(isMatched);
    });
  },

  initialize: function() {
    this.on('creating', this.hashPassword);
  }
});

module.exports = User;