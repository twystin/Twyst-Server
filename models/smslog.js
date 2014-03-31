'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SmsLogSchema = new Schema({
    user: {type: String},
    phone: {type: String},
    sms_text: {type: String},
    operator: {type: String},
    circle: {type: String},
    action : {type: String},
    merchant: {type: String},
    logged_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('SmsLog', SmsLogSchema);