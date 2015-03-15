var fs = require('fs');
var schedule = require('node-schedule');
var async = require('async');
var SmsSender = require('./smsSender');
var GcmBatcher = require('./gcmBatcher');
var notif = require('../../models/notif');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Notif = mongoose.model('Notif');

mongoose.connect('mongodb://localhost/twyst');

var job = schedule.scheduleJob({
  minute: 56,
  dayOfWeek: [new schedule.Range(0, 6)]
}, jobRunner);

function jobRunner() {
  async.parallel({
    sms: function(callback) {
      smsNotifications(callback);
    },
    gcm: function(callback) {
      gcmNotifications(callback);
    }
  }, function(err, results) {
    console.log(results);
  });
};


function smsNotifications(callback) {
  getNotifications(
    'SMS',
    new Date(Date.now() - 30 * 60 * 1000),
    new Date(Date.now() + 30 * 60 * 1000),
    'DRAFT',
    processSMSNotifications
  );

  function processSMSNotifications(notifs) {
    processNotifications(
      notifs,
      callback,
      SmsSender.sendBulkSMS
    );
  }
}

function gcmNotifications(callback) {
  getNotifications(
    'GCM',
    new Date(Date.now() - 30 * 60 * 1000),
    new Date(Date.now() + 30 * 60 * 1000),
    'DRAFT',
    processGCMNotifications
  );

  function processGCMNotifications(notifs) {
    processNotifications(
      notifs,
      callback,
      GcmBatcher.sendPush
    );
  }
}

// [AR] Added these as helper functions
function processNotifications(notifs, callback, doSomething) {
  var length = notifs.length || 0;
  if (length === 0) {
    callback(null, notifs);
  } else {
    notifs.forEach(function(item) {
      item.status = 'SENT';
      item.sent_at = Date.now();
      item.save();
      doSomething(item)
      if (--length === 0) {
        callback(null, notifs);
      };
    });
  }
}

function getNotifications(type, begin, end, status, callback) {
  console.log("Getting notifications from the database");
  Notif.find({
    message_type: type,
    scheduled_at: {
      $gte: begin,
      $lte: end
    },
    status: status
  }, function(err, notifs) {
    if (err) {
      console.log(err);
    } else {
      callback(notifs);
    }
  });
};
