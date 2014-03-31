var mongoose = require('mongoose');
var SmsLog = mongoose.model('SmsLog');
var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

module.exports.getApp = function(req, res) {
	var phone = req.query.mobile_number;

	if(phone.length >= 10) {
		phone = phone.substring(phone.length-10,phone.length);
	}

	var sms_text = req.query.sms_text;
	var date_time = req.query.date_time;
	var operator = req.query.operator;
	var circle = req.query.circle;

	var merchant = '';
	
	var sms_text = sms_text.split(' ');
	var merchant = sms_text[1];

	res.send(200); // Success to ValueFirst
	
	assembleLog(phone, sms_text, date_time, operator, circle, merchant);

	sendAppDownloadSMS(phone, merchant);
}

function sendAppDownloadSMS(mobile, merchant) {
	var merchant = merchant || '';
	var message = "Thanks, please click on the link to get Twyst on your Android phone: http://twyst.in/download/%23/" + mobile + '/' + merchant + ". The Twyst app will be available for other smartphones soon.";
	
	var send_sms_url = sms_push_url + mobile + "&from=TWYSTR&udh=0&text=" + message;
	
	http.post(send_sms_url, function(res){
		console.log(res);
	});
}

function assembleLog(phone, sms_text, date_time, operator, circle, merchant) {
	var created_log = {};

	created_log.phone = phone;
	created_log.sms_text = sms_text;
	created_log.operator = operator;
	created_log.circle = circle;
	created_log.merchant = merchant;
	created_log.action = "User sent sms for App download.";
	createLog(createLog);
}

function createLog (created_log) {
	
	var log = new SmsLog(created_log);
	
	log.save(function(err) {
		if (err) {
			
		} else {
			
		}				
	});
}