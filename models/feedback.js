'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');
var Outlet = mongoose.model('Outlet');

var FeedbackSchema = new Schema({
	account: {type: Schema.ObjectId, ref: 'Account'},
	outlet: {type: Schema.ObjectId, ref: 'Outlet'},
	feedback: {},
	created_date: {type: Date, default: Date.now()},
	modified_date: {type: Date, default: Date.now()}
})

module.exports = mongoose.model('Feedback', FeedbackSchema);