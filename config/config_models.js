'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
    // Add model file names here and gets registered automatically
    var models = [
        'account', 'offer', 'outlet', 'program', 'voucher', 'tier', 'recommendation',
        'checkin', 'favourite', 'qr_code', 'tag', 'beta_users', 'log', 'smslog',
        'smsMessageSentLogs', 'redirect', 'temp_otp', 'notif', 'social', 'rating',
        'recco_config', 'userLoc', 'rewards', 'winback', 'beta_merchants', 'group_program', 'feedback'
    ];

    models.forEach(function (m) {
        var model = require('../models/' + m);
    });

    mongoose.model('Account').schema.add({
        account: {type: Schema.ObjectId, ref: 'Account'}
    });
};