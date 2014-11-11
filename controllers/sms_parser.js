'use strict';
var mongoose = require('mongoose');
var SmsCheckinModule = require('./checkins/sms/main');
var SmsCheckinCodeModule = require('./getSMSCheckinCode');
var VoucherRedeemModule = require('./voucher_redeem');
var SmsSentLog = mongoose.model('SmsSentLog');
var BlackLister = require('./blacklister');
var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

module.exports.reciever = function(req, res) {
	
	var phone = req.query.mobile_number;
	
	var sms_text = req.query.sms_text;
	var date_time = req.query.date_time;
	var operator = req.query.operator;
	var circle = req.query.circle;
	
	res.send(200); // Success to ValueFirst
	
	if(phone.length >= 10) {
		phone = phone.substring(phone.length-10,phone.length);
		smsParser(req, res, sms_text, phone);
	}
};

function smsParser(req, res, sms_text, phone) {
	sms_text = sms_text.toUpperCase();

	sms_text = sms_text.split(' ');

	var signal = sms_text[0];

	if(signal === 'CHK' && sms_text.length > 1) {
		var code = sms_text[1];

		handleCheckin(code, phone);
	}
	else if(
		signal === 'CODE' &&
		sms_text.length > 1 &&
		!isNaN(sms_text[1]) &&
		!Number(sms_text[1]) < 1) {

		var num = Number(sms_text[1]);

		sendSmsCode(req, res, num, phone);
	}
	else if(signal === 'RDM' && sms_text.length > 1) {
		var code = sms_text[1];

		handleVoucher(req, res, code, phone);
	}
	else if(signal === 'STOP' && sms_text.length > 2) {
		var code = sms_text[1];
		BlackLister.blacklister(code, phone,'SMS');
	}
	else {
		var message = 'Sorry, the message format is incorrect. Please try again.';
		responder(phone, message);
	}
}

function handleCheckin (code, phone) {
	var checkin = {
		phone: phone,
		checkin_type: "SMS",
		checkin_code: code
	};

	SmsCheckinModule.smsCheckin(checkin);
}

function sendSmsCode (req, res, num, phone) {

	if(num > 10) {
		num = 10;
	}
	SmsCheckinCodeModule.smsCheckinCodeCreate(req, res, num, phone);
}

function handleVoucher (req, res, code, phone) {

	VoucherRedeemModule.recieveSmsRedeem(req, res, code, phone);
}

function responder(phone, push_message) {
	
	saveSentSms (phone, push_message);

	var message = push_message;
	var send_sms_url = sms_push_url + phone + "&from=TWYSTR&udh=0&text=" + message;
	
	http.post(send_sms_url, function(res){
		console.log(res);
	});
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