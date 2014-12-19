var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator"),
	SMS = require('../common/smsSender'),
	CommonUtilities = require('../common/utilities');
	Account = mongoose.model('Account'),
	OTP = mongoose.model('TempOTP');

var util = require('util'),
    crypto = require('crypto'),
    LocalStrategy = require('passport-local').Strategy,
    BadRequestError = require('passport-local').BadRequestError;

var options = {};
options.saltlen = options.saltlen || 32;
options.iterations = options.iterations || 25000;
options.keylen = options.keylen || 512;
    
options.hashField = options.hashField || 'hash';
options.saltField = options.saltField || 'salt';

module.exports.getOTP = function (req, res) {

	var phone = req.params.phone;
	if(!phone) {
		res.send(400, {
			'status': 'error',
			'message': 'Request incomplete',
			'info': 'Phone number required for OTP'
		})
	}
	else {
		initOtp();
	}

	function initOtp() {
		OTP.findOne({
			phone: phone
		})
		.exec(function (err, otp) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error processing OTP',
					'info': err
				})
			}
			else {
				if(otp) {
					var time_diff_last_otp = getTimeDiff(otp);
					if(time_diff_last_otp > 86400000) {
						genOtp(otp, true);
					}
					else if(time_diff_last_otp < 300000) {
						res.send(400, {
							'status': 'error',
							'message': 'The OTP code has already been sent',
							'info': 'The OTP code has already been sent'
						})
					}
					else {
						genOtp(otp, false);
					}
				}
				else {
					genOtp(null, true);
				}
			}
		})
	}

	function genOtp(otp_data, send_new) {
		if(!otp_data) {
			otp_data = {
				'phone': phone,
				'otp': keygen.number({length: 4})
			}
			otp_data = new OTP(otp_data);
		}
		else if(send_new) {
				otp_data.otp = keygen.number({length: 4});
		}
		saveOtp(otp_data, send_new);
	}

	function saveOtp(otp_data, send_new) {
		var otp_message = 'The Twyst OTP code is ';
		if(!send_new) {
			otp_message += otp_data.otp;
			SMS.sendSms(phone, otp_message);
			res.send(200, {
				'status': 'success',
				'message': 'The OTP code has been sent to you',
				'info': 'The OTP code has been sent to you'
			});
		}
		else {
			otp_data.save(function (err) {
				if(err) {
					res.send(400, {
						'status': 'error',
						'message': 'Error processing OTP',
						'info': err
					})
				}
				else {
					otp_message += otp_data.otp;
					SMS.sendSms(phone, otp_message);
					res.send(200, {
						'status': 'success',
						'message': 'The OTP code has been sent to you',
						'info': 'The OTP code has been sent to you'
					});
				}
			})
		}
	}

	function getTimeDiff(otp) {
		return otp.created_at ? (Date.now() - new Date(otp.created_at)) : 0;
	}
}

module.exports.updateDeviceId = function (req, res) { 

	var otp = req.body.otp;
	var phone = req.body.phone;
	phone = CommonUtilities.tenDigitPhone(phone);
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
				'message': 'The OTP you entered is incorrect.',
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