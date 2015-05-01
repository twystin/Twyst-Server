var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";
var http = require('http');
var mongoose = require('mongoose');
var conn2 = mongoose.createConnection('mongodb://50.112.253.131/twyst');
var smsSentLog = require('../../models/smsMessageSentLogs');
var SmsSentLog = conn2.model('SmsSentLog');
var async = require('async');

var account = require('../../models/account');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = mongoose.model('Account');

function checkBlacklisted(phone, cb) {
  Account.find({phone:phone, blacklisted:{$ne:true}}, function(err, user) {
    if (err) {
      console.log("BLACKLISTED");
      cb(false);
    } else {
      if (!user) {
        console.log("BLACKLISTED")
        cb(false);
      } else {
        cb(true);
      }
    }
  })
}

function filterBlacklisted(item, cb) {
  async.filter(item.phones, checkBlacklisted, function(results) {
      cb(item, results);
  })
}

module.exports.sendBulkSMS = function(item) {
  phones = filterBlacklisted(item, processSms);
}

function processSms(item, result) {
  var body = "";
  var from = item.from || 'TWYSTR'
  message = item.body;
  message = message.replace(/(\n)+/g, '');
  message = message.replace(/&/g, '%26');
  message = message.replace(/% /g, '%25 ');

  phones = result.join(',');
  var send_sms_url = sms_push_url +
    phones +
    "&from=" + from + "&text=" +
    message +
    "&category=bulk";

  saveSentSms(phones, message);
  http.get(send_sms_url, function(res) {
    console.log(res.statusCode);
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      console.log(body);
    });
    res.on('error', function(e) {
      console.log("Error message: " + e.message);
    });
  });
}

function saveSentSms(phone, message) {
  var sms_log = {};
  sms_log.phone = phone;
  sms_log.message = message;

  var sms_log = new SmsSentLog(sms_log);

  sms_log.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
}
