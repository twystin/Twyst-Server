'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TempOTPSchema = new Schema({
    phone: String,
    otp: String
});

module.exports = mongoose.model('TempOTP', TempOTPSchema);