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
  m.transport = "debug_transport";
  m.status.state = "QUEUED";
  m.status.date = new Date();
  m.to = acc._id;
  m.payload = {"title": "hi there"};
  m.save();
})
