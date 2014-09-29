var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";
var smsMessageSentLogs = require('../models/smsMessageSentLogs');
var http = require('http');
http.post = require('http-post');
var mongoose = require('mongoose');
var SmsSentLog = mongoose.model('SmsSentLog');
var Notif = mongoose.model('Notif');

module.exports.sendSms = function (phone, push_message, type) {

	push_message = push_message.replace(/(\n)+/g, '');
	
	var message = push_message.replace(/&/g,'%26');
	message = message.replace(/% /g,'%25 ');
	console.log(message);
	var send_sms_url = sms_push_url + phone + "&from=TWYSTR&udh=0&text=" + message;

	function checkTimeAndType() {
		if(!type) {
			send();
		}
		if(type === 'CHECKIN_MESSAGE') {
			send();
		}
		if(type === 'VOUCHER_MESSAGE') {

		}
	}

	function schedule() {

	}

	function send() {
		http.get(send_sms_url, function(res){
			console.log(res.statusCode);
			var body = '';
			res.on('data', function(chunk) {
	            // append chunk to your data
	            body += chunk;
	        });

	        res.on('end', function() {
	        	saveSentSms(phone, message, body);
	            console.log(body);
	        });

	        res.on('error', function(e) {
	        	saveSentSms(phone, message, e);
	            console.log("Error message: " + e.message)
	        });
		});
	}
}

function saveSentSms (phone, message, status) {

	var sms_log = {};
	sms_log.phone = phone;
	sms_log.message = message;
	sms_log.status = status;
	
	var sms_log = new SmsSentLog(sms_log);

	sms_log.save(function (err) {
		if(err) {
			console.log(err);
		}
	});
}