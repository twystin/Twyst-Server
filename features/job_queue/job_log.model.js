'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JobLogSchema = new Schema({
  name: {type: String},
  state: {type: String, enum: ['SCHEDULED', 'STARTED', 'RUN', 'ERROR', 'STOPPED']},
  logged: {type: Date, default: Date.now}
});

module.exports = mongoose.model('JobLog', JobLogSchema);
