'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VoucherReminderSchema = new Schema({
    voucher: {type: Schema.ObjectId, ref: 'Voucher'},
    user: {type: Schema.ObjectId, ref: 'Account'},
    batch: {type: Boolean, default: false},
    is_processed_today: {type: Boolean, default: false},
    timeline: []
});

module.exports = mongoose.model('VoucherReminder', VoucherReminderSchema);