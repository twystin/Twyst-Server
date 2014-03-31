var mongoose = require('mongoose');
var Checkin = mongoose.model('Checkin');
var Qr = mongoose.model('Qr');
var Outlet = mongoose.model('Outlet');
var keygen = require("keygenerator");
var SmsSentLog = mongoose.model('SmsSentLog');

var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

module.exports.smsCheckinCodeCreate = function (req, res, num, phone) {

	var phone;

	findOutlet(phone);
	var outlet;
	var i;

	var codes = [];

	function findOutlet (phone) {
		Outlet.findOne({'contact.phones.reg_mobile':{$elemMatch: {num: phone}}}, function (err, outlet) {
			if(err || outlet === null) {
				var push_message = 'Sorry, the message format is incorrect. Please try again.';
				responder(phone, push_message);
			}
			else {
				getCheckinCodeEntity(outlet, phone);
			}
		});
	}

	function getCheckinCodeEntity(outlet, phone) {
		var qr = {};
		qr.outlet_id = outlet._id;
		qr.max_use_limit = 5;
		qr.validity = {};
		qr.validity.start = Date.now();
		qr.validity.end = Date.now() + 21600000;
		qr.type = "single";

		for(i = 0; i < num; i++) {
			generateQrCode (qr, phone);
		}
	}

	function generateQrCode (qr_n, phone) {
		var qr = {};
		qr = _.extend(qr, qr_n);
		var qrcode = keygen._({forceUppercase: true, length: 6});
		qr.code = qrcode;
		saveQr(qr, phone);
	}

	var count = 0;

	function saveQr (qr, phone) {
		
		var qr = new Qr(qr);

		qr.save(function (err, qr) {
			codes.push(qr.code);
			++count;		
			if(count === num) {
				var push_message = codes.join(' ');
				responder(phone, push_message);
			}
		});
	}
}

function responder(phone, push_message) {
	
	saveSentSms (phone, "Checkin codes are: "+push_message);
	console.log("Checkin codes are: "+push_message);
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