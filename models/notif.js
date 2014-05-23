'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotifSchema = new Schema({
    phones: [String],
    message_type: String,
    head: String,
    body: String,
    server_key: String,
    gcms: [String],
    applicability_day: {type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday','all days']},
    applicability_time: {type: String, enum: ['breakfast', 'brunch', 'lunch', 'dinner', 'all day', 'evening']},
    priority: {type: Number},
    status: {type: String, enum: ['DRAFT', 'SENT', 'ERROR'], default: 'DRAFT'},
    logged_at: {type: Date, default: Date.now},
    scheduled_at: {type: Date},
    sent_at: {type: Date},
    comment: String
});

module.exports = mongoose.model('Notif', NotifSchema);