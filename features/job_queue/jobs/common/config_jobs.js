'use strict';
require('../../../../config/config_models')();

global._ = require('underscore');
global.schedule = require('node-schedule');
global.keygen = require("keygenerator");
global.async = require('async');
global.fs = require('fs');
global.sys = require('sys');
global.exec = require('child_process').exec;
global.admzip = require('adm-zip');
global.mongoose = require('mongoose');
global.Schema = mongoose.Schema;

module.exports.values = {
  'active': 'LOCAL',
  'debug': true,
  'env': {
    'PROD': {
      'DB': 'mongodb://50.112.253.131/twyst',
      'HOST': 'twyst.in',
      'DBIP': '50.112.253.131'
    },
    'STAGING': {
      'DB': 'mongodb://localhost/twyst',
      'HOST': 'staging.twyst.in',
      'DBIP': ''
    },
    'LOCAL': {
      'DB': 'mongodb://localhost/twyst',
      'HOST': 'localhost',
      'DBIP': '127.0.0.1'
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
