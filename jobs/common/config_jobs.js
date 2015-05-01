'use strict';
require('../../config/config_models')();

global._ = require('underscore');
global.schedule = require('node-schedule');
global.keygen = require("keygenerator");
global.async = require('async');
global.mongoose = require('mongoose');

module.exports.values = {
  'active': 'LOCAL',
  'debug': true,
  'env': {
    'PROD': {
      'DB': 'mongodb://localhost/twyst'
    },
    'STAGING': {
      'DB': 'mongodb://localhost/twyst'
    },
    'LOCAL': {
      'DB': 'mongodb://localhost/twyst'
    }
  },
  'jobs': {
    'winback': {
      'run': {
        'begin': 0,
        'end': 6,
        'hour': null,
        'minute': 3
      }
    },
    'birthday': {

    },
    'sms': {

    },
    'admin_mail': {

    },
    'merchant_mail': {

    },
    'voucher_reminder': {

    },
    'redeem': {

    }
  }
};
