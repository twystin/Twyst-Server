'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BetaUsersSchema = new Schema({
    email: {type: String, trim: true, required: true, unique: true},
    city: {type: String, trim: true},
    created_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('BetaUsers', BetaUsersSchema);