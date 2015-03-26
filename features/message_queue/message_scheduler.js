'use strict';
var mongoose = require('mongoose');

require('./message_queue.model');
var MessageQueue = mongoose.model('MessageQueue');
mongoose.connect("mongodb://localhost/twyst");

module.exports.send = function(to, transport, payload, now) {
  var m = new MessageQueue();

  if (now == true ) {

  } else {
    m.transport = transport
    m.status.state = "QUEUED";
    m.status.date = new Date();
    m.to = to;
    m.payload = payload;

    m.save();
  }
}
