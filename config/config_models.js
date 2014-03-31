'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
    var account = require('../models/account'),
        offer = require('../models/offer'),
        outlet = require('../models/outlet'),
        program = require('../models/program'),
        voucher = require('../models/voucher'),
        tier = require('../models/tier'),
        recommendation = require('../models/recommendation'),
        checkin = require('../models/checkin'),
        favourite = require('../models/favourite'),
        qr = require('../models/qr_code'),
        tag = require('../models/tag'),
        beta_users = require('../models/beta_users'),
        logs = require('../models/log'),
        logs = require('../models/smslog'),
        smsMessageSentLogs = require('../models/smsMessageSentLogs'),
        redirect = require('../models/redirect'),
        temp_otp = require('../models/temp_otp'),
        beta_merchants = require('../models/beta_merchants');

    mongoose.model('Account').schema.add({
        account: {type: Schema.ObjectId, ref: 'Account'}
    });
};