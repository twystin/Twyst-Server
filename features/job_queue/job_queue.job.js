'use strict';
var mongoose = require('mongoose');
var async = require('async');
var schedule = require('node-schedule');
var logger = require('../logger/logger');
require('./job_queue.model');
require('./job_log.model');
var JobQueue = mongoose.model('JobQueue');
var JobLog = mongoose.model('JobLog');

// Schedule the job to run every 5 minutes
var rule = new schedule.RecurrenceRule();
rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
var jobrunner = schedule.scheduleJob(rule, main);

function main() {
  console.log("JOB RUNNER STARTING - " + new Date());
  var query = {
    $or: [
      {last_run: null},
      {last_run: {$lt: new Date() - 60*60*1000}}
    ]
  }

  mongoose.connect("mongodb://localhost/twyst");

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

}

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
