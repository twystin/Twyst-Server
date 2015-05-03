'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./account');
require('./user.mdl');
var Account =  mongoose.model('Account');
var User = mongoose.model('User');

var AuthToken = new Schema({
  token: String,
  expiry: Date,
  account: {type: Schema.ObjectId, ref:Account},
  user: {type: Schema.ObjectId, ref:User},
});

module.exports = mongoose.model('AuthToken', AuthToken);
