'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');
var Offer = mongoose.model('Offer');
var Outlet = mongoose.model('Outlet');

var FavouriteSchema = new Schema({
    outlets: {type: Schema.ObjectId, ref: 'Outlet'},
    account: {type: Schema.ObjectId, ref: 'Account'},
    program: {type: Schema.ObjectId, ref: 'Program'},
    tier: {type: Schema.ObjectId, ref: 'Tier'},
    offers: {type: Schema.ObjectId, ref: 'Offer'},
    created_date: {type: Date, default: Date.now},
    modified_date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Favourite', FavouriteSchema);