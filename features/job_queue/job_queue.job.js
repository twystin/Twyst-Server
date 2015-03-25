'use strict';
var mongoose = require('mongoose');
var async = require('async');
var logger = require('../logger/logger');


// Get the message queue model
require('./job_queue.model');
require('./job_log.model');

var JobQueue = mongoose.model('JobQueue');
var JobLog = mongoose.model('JobLog');

mongoose.connect("mongodb://localhost/twyst");

var query = {
  $or: [
    {last_run: null},
    {last_run: {$lt: new Date() - 60*60*1000}}
  ]
}

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
  var now = new Date();
  var day = now.getDay();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var to_run = require('./jobs/' + job.job);

  if (day > job.schedule.start &&
    day < job.schedule.end &&
    hour == job.schedule.hour) {
      to_run.run(function(success) {
        updateJob(job, cb, 'RUN');
      }, function(err) {
        updateJob(job, cb, 'ERROR');
      });
    } else {
      cb(job.name + " - not time yet")
    }
}

function allDone(err) {
  if (err) {
    console.log("Error:" + err);
    mongoose.disconnect();
  } else {
    console.log("All done");
    mongoose.disconnect();
  }
}

function updateJob(job, cb, state) {
  job.last_run = new Date();
  job.save(function(err) {
    if (err) {
      cb(err);
    } else {
      var joblog = new JobLog({
        name: job.name,
        state: state,
        logged: new Date()
      })

      joblog.save(function(err) {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      });
    }
  });
}
