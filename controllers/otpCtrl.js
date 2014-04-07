var mongoose = require('mongoose');
var TempOTP = mongoose.model('TempOTP');
var SmsSentLog = mongoose.model('SmsSentLog');
var keygen = require("keygenerator");
var Account = mongoose.model('Account');

var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

var util = require('util'),
    crypto = require('crypto'),
    LocalStrategy = require('passport-local').Strategy,
    BadRequestError = require('passport-local').BadRequestError;

options = {};
options.saltlen = options.saltlen || 32;
options.iterations = options.iterations || 25000;
options.keylen = options.keylen || 512;
    
options.hashField = options.hashField || 'hash';
options.saltField = options.saltField || 'salt';

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
		Account.findOne({phone: phone, role: {$gt: 5}}, function (err, user) {
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
					if(user.role === 6) {
						migrateUser(user);
					}
					else {
						updateUser();
					}
				}
			}
		});
	};

	function registerNewUser() {
		
		var account = {};
		account.username = phone;
		account.phone = phone;
		account.device_id = device_id;
		account.role = 7;
		account.otp_validated = true;

		Account.register(new Account(account), phone, function(err, user) {
	        if (err) {
	            res.send(400, {
	            	'status' : 'error',
	                'message' : 'Error registering user.',
	                'info':  JSON.stringify(err) 
	            });
	        } else {
	            returnResponse(user.username);
	        }
	    });
	}

	function updateUser() {
		Account.findOneAndUpdate({phone: phone, role: 7}, 
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
					returnResponse(user.username);
				}
		});
	}

	function migrateUser(user) {
		
		user.username = phone;
		user.phone = phone;
		user.device_id = device_id;
		user.role = 7;
		user.otp_validated = true;

		updatePassword(phone);

		function updatePassword (password) {

			crypto.randomBytes(options.saltlen, function(err, buf) {
	            if (err) {
	                res.send(400, {	
						'status' : 'error',
						'message': 'Error migrating user.',
						'info': JSON.stringify(err)
					});
	            }

	            var salt = buf.toString('hex');

	            crypto.pbkdf2(password, salt, options.iterations, options.keylen, function(err, hashRaw) {
	                if (err) {
	                    res.send(400, {	
							'status' : 'error',
							'message': 'Error generating password.',
							'info': JSON.stringify(err)
						});
	                }
	                else {
	                	user.hash = new Buffer(hashRaw, 'binary').toString('hex');
	                	user.salt = salt;
	                	
	                	saveUser();
	                }
	            });
	        });
		}
		
		function saveUser() {
			user.save(function (err) {
				if(err) {
					res.send(400, {	
						'status' : 'error',
						'message': 'Error updating device id.',
						'info': JSON.stringify(err)
					});
				}
				else {
					returnResponse(user.username);
				}
			});
		};
	}

	function returnResponse (username) {
		
		res.send(200, {
			'status': "success",
			'message': "Successfully verified User",
			'info': JSON.stringify(username)
		})
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