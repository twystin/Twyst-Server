'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SmsSentLogSchema = new Schema({
    phone: {type: String},
    message: {type: String},
    status: {type: String, default: 'SENT'},
    logged_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('SmsSentLog', SmsSentLogSchema);