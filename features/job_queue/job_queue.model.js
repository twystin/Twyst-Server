'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JobQueueSchema = new Schema({
  name: {type: String},
  job: {type: String},
  last_run: {type: Date},
  schedule: {}
});

module.exports = mongoose.model('JobQueue', JobQueueSchema);
