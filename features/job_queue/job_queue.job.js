'use strict';
var mongoose = require('mongoose');
var async = require('async');
var schedule = require('node-schedule');
var logger = require('../logger/logger');
require('./job_queue.model');
require('./job_log.model');
var JobQueue = mongoose.model('JobQueue');
var JobLog = mongoose.model('JobLog');

console.log("JOB RUNNER STARTING - " + new Date());
mongoose.connect("mongodb://localhost/twyst");

JobQueue.find({}, function(err, jobs) {
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
  console.log("SCHEDULING JOB: " + job.name + " AT:" + JSON.stringify(job.schedule));
  var to_run = require('./jobs/' + job.job);
  var jobrunner = schedule.scheduleJob(job.schedule, function() {
    to_run.run(function(success) {
      updateJob(job, cb, "RUN")
    }, function(error) {
      updateJob(job, cb, "ERROR")
    })
  });
}

function allDone(err) {
  if (err) {
    console.log("Error:" + err);
    mongoose.disconnect();
  } else {
    console.log("Completed a run");
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
