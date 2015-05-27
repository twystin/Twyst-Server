'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');
var Offer = mongoose.model('Winback');
var Outlet = mongoose.model('Outlet');
var Outlet = mongoose.model('Voucher');

var CorporateSchema = new Schema({
	company_name: {type: String},
    outlet: {type: Schema.ObjectId, ref: 'Outlet'},
    account: {type: Schema.ObjectId, ref: 'Account'},
    winback: {type: Schema.ObjectId, ref: 'Winback'},
    created_date: {type: Date, default: Date.now},
    modified_date: {type: Date, default: Date.now},
    is_redeem: {type: Boolean, default: false},
    voucher: {type: Schema.ObjectId, ref: 'Voucher'}

});

module.exports = mongoose.model('Corporate', CorporateSchema);