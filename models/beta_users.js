'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BetaUsersSchema = new Schema({
    email: {type: String, trim: true},
    city: {type: String, trim: true},
    name: {type: String, trim: true},
    phone: {type: String, trim: true},
    message: {type: String, trim: true},
    created_at : {type: Date, default: Date.now},
    contest: {type: String, trim: true}
});

module.exports = mongoose.model('BetaUsers', BetaUsersSchema);