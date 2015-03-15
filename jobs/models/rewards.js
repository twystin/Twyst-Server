'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');
var Offer = mongoose.model('Offer');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');

var RewardSchema = new Schema({
    program: {type: Schema.ObjectId, ref: 'Program'},
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
    status: {type: String},
    created_date: {type: Date, default: Date.now},
    modified_date: {type: Date, default: Date.now},
    rewards: [{
    	tier: {type: Schema.ObjectId, ref: 'Tier'},
    	offer: {type: Schema.ObjectId, ref: 'Offer'},
    	count : {type: Number},
    	reward: {type: String},
        description: {type: String},
        qr_only: {type: Boolean},
    	rewardified: {type: String}
    }]
});

module.exports = mongoose.model('Reward', RewardSchema);