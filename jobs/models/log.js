'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LogSchema = new Schema({
    user: {type: String},
    session: {type: String},
    level: {type: String},
    path: {type: String},
    message : {type: String},
    pos: {
        longitude: { type: String },
        latitude: { type: String }
    },
    logged_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Log', LogSchema);