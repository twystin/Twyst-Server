'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');

var userLocSchema = new Schema({
    account: {type: Schema.ObjectId, ref: 'Account'},
    phone: String,
    locations: [{
        latitude: Number,
        longitude: Number,
        logged_time: Date
    }],
});

module.exports = mongoose.model('UserLoc', userLocSchema);