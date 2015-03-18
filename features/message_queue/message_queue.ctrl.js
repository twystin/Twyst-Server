'use strict';
var mongoose = require('mongoose');

// Get the message queue model
require('./message_queue.model');
require('../../models/account');
var Account = mongoose.model('Account');

var MessageQueue = mongoose.model('MessageQueue');
mongoose.connect("mongodb://localhost/twyst");

Account.findOne({}, function(err, acc) {
  var m = new MessageQueue();
  m.transport = "gmail_transport";
  m.status.state = "QUEUED";
  m.status.date = new Date();
  m.to = acc._id;
  m.payload = {
      from: 'ar@twyst.in', // sender address
      to: 'ar@twyst.in, al@twyst.in, rc@twyst.in', // list of receivers
      subject: 'Daily analytics report', // Subject line
      text: 'Analytics report.', // plaintext body
      html: '<b>Analytics report.</b>', // html body,
  };

  m.save();
})
