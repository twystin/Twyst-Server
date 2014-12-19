'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TempOTPSchema = new Schema({
    phone: {type: String, unique: true},
    otp: {type: String},
    created_at: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('TempOTP', TempOTPSchema);