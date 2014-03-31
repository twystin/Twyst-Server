var mongoose = require('mongoose');
var TempOTP = mongoose.model('TempOTP');
var SmsSentLog = mongoose.model('SmsSentLog');
var keygen = require("keygenerator");

var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

module.exports.getOTP = function (req, res) {

	if(req.params && req.params.mobile) {
		sendOTP(req.params.mobile);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Request is empty',
			'info': ''
		});
	}

	function sendOTP(phone) {
		var otp_code = keygen.number({length: 6});
		var temp = {};
		temp.otp = otp_code;
		temp.phone = phone;

		var temp_otp = new TempOTP(temp);
		temp_otp.save(function (err, temp_otp) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error saving OTP',
					'info': JSON.stringify(err)
				});
			}
			else {
				var push_message = "The TWYST OTP code is " + otp_code;
				responder(phone, push_message);
				res.send(200, {
					'status': "success",
					'message': "Successfully generated OTP",
					'info': ""
				})
			}
		})
	}
}

module.exports.updateDeviceId = function (req, res) { 

}

function responder(phone, push_message) {

	saveSentSms(phone, push_message);

	var message = push_message.replace('&','n');
	console.log(message);
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