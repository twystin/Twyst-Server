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
	checkType();
	function checkType() {
		var time = null;
		time = Date.now();
		time += (5 * 60 * 60 * 1000 + 30 * 60 * 1000);
		if(type === 'VOUCHER_MESSAGE') {
			time = time + 3 * 60 * 60 * 1000;
		}
		if(isAccurateTime(time)) {
			if(type !== 'VOUCHER_MESSAGE') {
				send();
			}
			else {
				schedule(phone, message, time);
			}
		}
		else {
			var schedule_time = getScheduleTime(time);
			schedule(phone, message, schedule_time);
		}
	}

	function getScheduleTime(time) {
		var hours = new Date(time).getHours();
		var year = new Date(time).getFullYear();
		var month = new Date(time).getMonth();
		var date = new Date(time).getDate();
		var hours = new Date(time).getHours();
		if(hours > 23) {
			return new Date(year, month, date).getTime() + 35 * 60 * 60 * 1000;
		}
		else {
			hours = 11;
			return new Date(year, month, date, hours);
		}
	}

	function isAccurateTime (time) {
		var hours = new Date(time).getHours();
		if(hours > 23 || hours < 9) {
			return false;
		}
		return true;
	}

	function schedule(phone, message, time) {
		var obj = {};
		obj.phones = [];
		obj.phones.push(phone);
		obj.head = type;
		obj.body = message;
		obj.status = 'DRAFT';
		obj.message_type : "SMS";
		obj.logged_at = Date.now();
		obj.scheduled_at = new Date(time);
		var notif = new Notif(obj);

		notif.save(function (err) {
			if(err) {
				console.log(err);
			}
			else {
				console.log("Saved notif");
			}
		});
	}

	function send() {
		var send_sms_url = sms_push_url + phone + "&from=TWYSTR&udh=0&text=" + message;
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