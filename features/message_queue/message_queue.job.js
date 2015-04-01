'use strict';
var mongoose = require('mongoose');
var async = require('async');
var logger = require('../logger/logger');


// Get the message queue model
require('./message_queue.model');
var MessageQueue = mongoose.model('MessageQueue');
mongoose.connect("mongodb://localhost/twyst");

var query = {
  'status.state': {
    $in: ['QUEUED', 'RETRY']
  }
}

MessageQueue.find(query, function(err, messages) {
  if (err) {
    logger.alert(
      logger.getStatusObject('error', 'Error getting messages from message queue', err),
      false,
      false);
    mongoose.disconnect();
  } else {
    if (messages.length === 0) {
      logger.notify(
        logger.getStatusObject('error', 'No messages in queue', null),
        false,
        false);
      mongoose.disconnect();
    } else {
      async.each(messages, processMessage, allDone);
    }
  }
});

function processMessage(message, cb) {
  var transport = require('./transports/' + message.transport);
  var now = new Date();
  var day = now.getDay();
  var hour = now.getHours();
  var minutes = now.getMinutes();

  if (message.schedule) {
    if (message.schedule.start < day
    && message.schedule.end > day
    && message.schedule.hour === hour
    && message.schedule.minute - minute < 30) {
      transport.send(message.to, message.payload, function(success) {
        message.status.state = "SENT";
        message.status.logged = new Date();
        message.save(function(err) {
          if (err) {
            cb(err);
          } else {
            cb(null);
          }
        });
      }, function(err) {
        cb(err);
      });
    } else {
      logger.notify(
        logger.getStatusObject('error', 'Not yet time', null),
        false,
        false);
    }
  } else {
    logger.notify(
      logger.getStatusObject('error', 'No scheduled time', null),
      false,
      false);
  }
}

function allDone(err) {
  if (err) {
    console.log("Error:" + err);
  } else {
    console.log("All done");
    mongoose.disconnect();
  }
}