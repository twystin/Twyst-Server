'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Since we're referencing Account in the schema.
require('../../models/account');
var Account = mongoose.model('Account');

var MessageQueueSchema = new Schema({
  to: {type: Schema.ObjectId, ref: 'Account'},
  transport: {type: String, enum: ['sms_transport', 'email_transport', 'push_transport', 'debug_transport']},
  status:  {
    state: {type: String, enum: ['QUEUED', 'SENT', 'FAIL', 'RETRY', 'ERROR', 'ARCHIVED']},
    logged: {type: Date}
  },
  payload: {},
  schedule: {
    immediate: {type: Boolean},
    pattern: {type: String},
    hour: {type: Number},
    minute: {type: Number},
    start: {type: Number},
    end: {type: Number}
  }
});

module.exports = mongoose.model('MessageQueue', MessageQueueSchema);
