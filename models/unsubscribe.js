'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');
var Outlet = mongoose.model('Outlet'); 

var sections = {
	all : {type: Boolean, default: false},
	outlets: [{type: Schema.ObjectId, ref: 'Outlet'}]
};

var message_types = {
	transactional: sections,
	reminders: sections,
	promotional: sections
};

var UnsubscribeSchema = new Schema ({
	user_id : {type: Schema.ObjectId, ref: 'Account'},
	phone : {type: Number},
	sms: message_types,
	email: message_types,
	push: message_types,
	blacklisted: {type: Boolean, default: false}
});

module.exports = mongoose.model('Unsbs', UnsubscribeSchema);