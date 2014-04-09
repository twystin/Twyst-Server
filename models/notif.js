'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotifSchema = new Schema({
    phone: {type: String},
    message: {
    	head: String,
    	body: String
    },
    applicability_day: {type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday','all days']},
    applicability_time: {type: String, enum: ['breakfast', 'brunch', 'lunch', 'dinner', 'all day', 'evening']},
    priority: {type: Number},
    status: {type: String, enum: ['DRAFT', 'SENT', 'ERROR'], default: 'DRAFT'},
    logged_at: {type: Date, default: Date.now},
    scheduled_at: {type: Date},
    sent_at: {type: Date},
    comments: String
});

module.exports = mongoose.model('Notif', NotifSchema);