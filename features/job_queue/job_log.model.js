'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JobLogSchema = new Schema({
  name: {type: String},
  state: {type: String, enum: ['RUN', 'ERROR', 'STOPPED']},
  logged: {type: Date}
});

module.exports = mongoose.model('JobLog', JobLogSchema);
