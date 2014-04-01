var mongoose = require('mongoose');
var TempOTP = mongoose.model('TempOTP');
var SmsSentLog = mongoose.model('SmsSentLog');
var keygen = require("keygenerator");
var Account = mongoose.model('Account');

var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

module.exports.getOTP = function (req, res) {

	if(req.params && req.params.mobile) {
		searchOTP(req.params.mobile);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Request is empty',
			'info': ''
		});
	}

	function searchOTP(phone) {
		var otp_code = keygen.number({length: 6});
		var temp = {};
		temp.otp = otp_code;
		temp.phone = phone;

		var temp_otp = new TempOTP(temp);

		TempOTP.findOne({phone: phone}, function (err, existing_otp) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error generating OTP',
					'info': JSON.stringify(err)
				});
			}
			else {
				if(existing_otp !== null) {
					existing_otp.otp = otp_code;
					saveOTP(existing_otp);
				}
				else {
					saveOTP(temp_otp);
				}
			}
		});

		function saveOTP (new_otp) {

			new_otp.save(function (err, new_otp) {
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
			});
		};
	};
}

module.exports.updateDeviceId = function (req, res) { 

	var otp = req.body.otp;
	var phone = req.body.phone;
	var device_id = req.body.device_id;

	if(otp && phone && device_id) {
		findOTP(phone);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Request has missing values.',
			'info': ''
		});
	};

	function findOTP (phone) {

		TempOTP.findOne({phone: phone}, function (err, existing_otp) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting OTP.',
					'info': JSON.stringify(err)
				});
			}
			else {
				if(existing_otp === null) {
					res.send(200, {
						'status': 'error',
						'message': 'Error getting OTP.',
						'info': JSON.stringify(err)
					});
				}
				else {
					matchPhoneAndOTP(existing_otp);
				}
			}
		});
	}

	function matchPhoneAndOTP(existing_otp) {

		if((existing_otp.phone === phone) && (existing_otp.otp === otp)) {
			checkIfExistingUser(phone);
		}
		else {
			res.send(400, {
				'status': 'error',
				'message': 'The OTP you enterd is incorrect.',
				'info': ''
			});
		}
	};

	function checkIfExistingUser (phone) {
		Account.findOne({phone: phone, role: 6}, function (err, user) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error serving your request currently.',
					'info': JSON.stringify(err)
				});
			}
			else {
				if(user === null) {
					registerNewUser();
				}
				else {
					updateUser();
				}
			}
		});
	};

	function registerNewUser() {
		
		var account = {};
		account.username = phone;
		account.phone = phone;
		account.device_id = device_id;
		account.role = 6;
		account.otp_validated = true;

		Account.register(new Account(account), '', function(err, user) {
	        if (err) {
	            res.send(400, {
	            	'status' : 'error',
	                'message' : 'Error registering user.',
	                'info':  JSON.stringify(err) 
	            });
	        } else {
	            requestLogin(phone, "");
	        }
	    });
	}

	function updateUser() {
		Account.findOneAndUpdate({phone: phone, role: 6}, 
			{$set: {device_id: device_id, otp_validated: true} },
			{upsert:true},
			function(err,user) {
				if (err) {
					res.send(400, {	
						'status' : 'error',
						'message': 'Error updating device id.',
						'info': JSON.stringify(err)
					});
				} else {
					requestLogin(user.username, "");
				}
		});
	}

	function requestLogin (username, password) {
		
		http.post('http://dogfood.twsyt.in/api/v1/auth/login', {username: username, password: password}, function(response){
						
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function () {
				if(response.statusCode === 200) {
					res.send(response.statusCode, {
						'status' : 'success',
						'message': 'Successfully authentiated user.',
						'info': JSON.stringify(body)
					});
				}
				else {
					res.send(response.statusCode, {
						'status' : 'Error',
						'message': 'Error authentiated user.',
						'info': JSON.stringify(body)
					});
				}
			});
		});
	}
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