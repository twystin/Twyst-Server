'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Offer = mongoose.model('Offer');
var Account = mongoose.model('Account');

var RecommendationSchema = new Schema({
    offer_id: {type: Schema.ObjectId, ref: 'Offer'},
    account_id: {type: Schema.ObjectId, ref: 'Account'},
    created_date: {type: Date, default: Date.now},
    modified_date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);