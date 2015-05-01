'use strict';
var mongoose = require('mongoose');
var _ = require('underscore');

require('./message_queue.model');
var MessageQueue = mongoose.model('MessageQueue');

module.exports.schedule = function(message, cb) {
  mongoose.connect("mongodb://localhost/twyst");
  var m = new MessageQueue(message)
  m.save(function(err) {
    if(err) {
      cb(err)
    } else {
      cb(null);
    }
  });
}

module.exports.send = function(message, success, error) {
  var m = new MessageQueue(message);
  var transport = require('./transports/' + m.transport);
  transport.send(message.to, message.payload, function(data) {
    success(data);
  }, function(err) {
    error(err);
  });
}

module.exports.create_ses = function(to, subject, body, sender) {
  var payload = {
    Destination: {
      ToAddresses: [
        to
      ]
    },
    Message: {
      Body: {
        Text: {
          Data: body
        }
      },
      Subject: { /* required */
        Data: subject
      }
    },
    Source: sender
  };

  var message = {
    transport: 'ses_transport',
    payload: payload,
    to: null
  }

  return message;
}
