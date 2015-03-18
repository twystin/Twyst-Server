'use strict';
var mongoose = require('mongoose');

// Get the message queue model
require('./message_queue.model');
require('../../models/account');
var Account = mongoose.model('Account');

var MessageQueue = mongoose.model('MessageQueue');
mongoose.connect("mongodb://localhost/twyst");

// Test code for creating GMail transport
// Account.findOne({}, function(err, acc) {
//   var m = new MessageQueue();
//   m.transport = "gmail_transport";
//   m.status.state = "QUEUED";
//   m.status.date = new Date();
//   m.to = acc._id;
//   m.payload = {
//       from: 'ar@twyst.in', // sender address
//       to: 'ar@twyst.in, al@twyst.in, rc@twyst.in', // list of receivers
//       subject: 'Daily analytics report', // Subject line
//       text: 'Analytics report.', // plaintext body
//       html: '<b>Analytics report.</b>', // html body,
//   };
//
//   m.save();
// })

Account.findOne({}, function(err, acc) {
  var m = new MessageQueue();
  m.transport = "vf_sms_transport";
  m.status.state = "QUEUED";
  m.status.date = new Date();
  m.to = acc._id;
  m.payload = {
    phone: '9779456097',
    from: 'TWYSTR',
    message: 'Test message'
  };

  m.save();
})
