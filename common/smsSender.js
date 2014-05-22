var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";
var smsMessageSentLogs = require('../models/smsMessageSentLogs');
var http = require('http');
http.post = require('http-post');
var mongoose = require('mongoose');
var SmsSentLog = mongoose.model('SmsSentLog');

module.exports.sendSms = function (phone, push_message) {

	push_message = push_message.replace(/(\n)+/g, '');
	
	var message = push_message.replace(/&/g,'%26');
	message = message.replace(/% /g,'%25 ');
	console.log(message);
	saveSentSms(phone, message);
	var send_sms_url = sms_push_url + phone + "&from=TWYSTR&udh=0&text=" + message;
	var test_url = 'http://staging.twyst.in/api/v2/sms/status';
	// http.post(send_sms_url, function(res){
	// 	console.log(res.statusCode);
	// 	res.on('data', function(chunk) {
 //            // append chunk to your data
 //            body += chunk;
 //        });

 //        res.on('end', function() {
 //            console.log(body);
 //        });

 //        res.on('error', function(e) {
 //            console.log("Error message: " + e.message)
 //        });
	// });
}

function saveSentSms (phone, message) {

	var sms_log = {};
	sms_log.phone = phone;
	sms_log.message = message;
	
	var sms_log = new SmsSentLog(sms_log);

	sms_log.save(function (err) {
		if(err) {
			console.log(err);
		}
	});
}