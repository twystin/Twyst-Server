'use strict';
var mongoose = require('mongoose');
var async = require('async');
var logger = require('../logger/logger');


// Get the message queue model
require('./job_queue.model');
var JobQueue = mongoose.model('JobQueue');
mongoose.connect("mongodb://localhost/twyst");

var query = {
};

JobQueue.find(query, function(err, jobs) {
  if (err) {
    logger.alert(
      logger.getStatusObject('error', 'Error getting jobs from job queue', err),
      false,
      false);
    mongoose.disconnect();
  } else {
    if (jobs.length === 0) {
      logger.notify(
        logger.getStatusObject('error', 'No jobs in queue', null),
        false,
        false);
      mongoose.disconnect();
    } else {
      async.each(jobs, processJob, allDone);
    }
  }
});

function processJob(job, cb) {
  var job = require('./jobs/' + job.job);
  job.run(function(success) {
    // job.status.state = "RUN";
    // job.status.logged = new Date();
    // job.save(function(err) {
    //   if (err) {
    //     cb(err);
    //   } else {
    //     cb(null);
    //   }
    // });
  }, function(err) {
    cb(err);
  });
}

function allDone(err) {
  if (err) {
    console.log("Error:" + err);
  } else {
    console.log("All done");
    mongoose.disconnect();
  }
}
