var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twyst');
require('../config/config_models')();
var Checkin = mongoose.model('Checkin');
var Outlet = mongoose.model('Outlet');
var Account = mongoose.model('Account');
var BirthAnniv = mongoose.model('BirthAnniv');
var schedule = require('node-schedule');
var async = require('async');

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0,6)];
rule.hour = 10;
rule.minute = 0;

var j = schedule.scheduleJob(rule, function(){

  asycn.waterfall([
    function findActivePrograms(){
      BirthAnniv.find({
        status : 'active'
      }, function(err, programs){
        if (err){
          console.log("Errors in getting checkins")
        }
        else{
          if (programs === null){
            console.log("No Active BirthAnniv Programs found");
          }
          else {
            callback(programs);
          }
        }
      })
    },
    function forEachProgram(){
      async.each(programs, function(p, callback){
        Checkin.aggregate({
          $group : {
            _id : "$phone",
            totalCheckins: {}
          }
        }, function(err, checkins){
          if (err){
            console.log("Errors in getting checkins");
          }
          else {
            if (checkins === null){
              console.log("No Checkins found in these outlets")
            }
            else {

            }
          }
        })
      })
    }
  ])
})