var schedule = require('node-schedule');
var nodemailer = require('nodemailer');
var AdmZip = require('adm-zip');
var fs = require('fs');
var Summary = require('./helpers/twyst_summary/summary');
var RawData = require('./helpers/twyst_summary/rawdata');
var async = require('async');

module.exports.run = function(success, error) {
  console.log("Running analytics");
  async.parallel({
    summary: function(callback) {
      Summary.getCount(callback);
    },
    rawdata: function(callback) {
      RawData.execAsyncCommands(callback);
    }
  }, function(err, results) {
    // Need a timeout here
    var zip = new AdmZip();
    zip.addLocalFile("./data/summary.csv");
    zip.addLocalFile("./data/checkins.csv");
    zip.addLocalFile("./data/accounts.csv");
    zip.addLocalFile("./data/vouchers.csv");
    zip.writeZip("./data/report.zip");
    success("done");
  });
}
