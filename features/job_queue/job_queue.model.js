'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JobQueueSchema = new Schema({
  name: {type: String},
  job: {type: String},
  last_run: {type: Date},
  schedule: {
    hour: {type: Number},
    minute: {type: Number},
    start: {type: Number},
    end: {type: Number}
  }
});

module.exports = mongoose.model('JobQueue', JobQueueSchema);
