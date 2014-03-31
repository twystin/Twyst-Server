'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Offer = mongoose.model('Offer');

var CheckinSchema = new Schema({
    phone: {type: String},
    outlet: {type: Schema.ObjectId, ref: 'Outlet'},
    checkin_program: {type: Schema.ObjectId, ref: 'Program'},
    checkin_tier: {type: Schema.ObjectId, ref: 'Tier'},
    checkin_for: {type: Schema.ObjectId, ref: 'Offer'},
    checkin_date: {type: Date, default: Date.now},
    checkin_validated: {type: Boolean},
    checkin_code: {type: String},
    checkin_type: {type: String, enum: ['QR', 'SMS', 'PANEL']},
    created_date: {type: Date, default: Date.now},
    modified_date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Checkin', CheckinSchema);