var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator"),
	SMS = require('../common/smsSender'),
	CommonUtilities = require('../common/utilities');
	Account = mongoose.model('Account'),
	OTP = mongoose.model('TempOTP');

module.exports.getOTP = function (req, res) {

	var phone = req.params.phone;
	if(!phone) {
		res.send(400, {
			'status': 'error',
			'message': 'Request incomplete',
			'info': 'Phone number required for verification code'
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
					'message': 'Error processing verification',
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
							'message': 'The verification code has already been sent',
							'info': 'The verification code has already been sent'
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
		var otp_message = 'Your Twyst verification code is ';
		if(!send_new) {
			otp_message += otp_data.otp;
			SMS.sendSms(phone, otp_message);
			res.send(200, {
				'status': 'success',
				'message': 'The verification code has been sent to you',
				'info': 'The verification code has been sent to you'
			});
		}
		else {
			otp_data.save(function (err) {
				if(err) {
					res.send(400, {
						'status': 'error',
						'message': 'Error processing verification code',
						'info': err
					})
				}
				else {
					otp_message += otp_data.otp;
					SMS.sendSms(phone, otp_message);
					res.send(200, {
						'status': 'success',
						'message': 'The verification code has been sent to you',
						'info': 'The verification code has been sent to you'
					});
				}
			})
		}
	}

	function getTimeDiff(otp) {
		return otp.created_at ? (Date.now() - new Date(otp.created_at)) : 0;
	}
}

module.exports.validateOtp = function (req, res) { 

	var otp = req.body.otp,
		phone = CommonUtilities.tenDigitPhone(req.body.phone);

	if(otp && phone) {
		validateOtp();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Request has missing values.',
			'info': 'Request requires phone and verification code'
		});
	};

	function validateOtp() {
		OTP.findOne({
			phone: phone,
			otp: otp
		})
		.exec(function (err, otp) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting verification code',
					'info': err
				});
			}
			else if(!otp) {
				res.send(400, {
					'status': 'error',
					'message': 'Incorrect verification code',
					'info': 'Incorrect verification code'
				});
			}
			else {
				processUser();
			}
		})
	}

	function processUser() {
		Account.findOne({
			phone: phone, 
			role: {
				$gt: 5
			}
		})
		.exec(function (err, user) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting user',
					'info': err
				});
			}
			else if(!user) {
				registerUser(function (err, user) {
					if(err) {
						res.send(400, {
							'status': 'error',
							'message': 'Error registering user',
							'info': err
						});
					}
					else {
						res.send(200, {
							'status': 'success',
							'message': 'User registered successfull',
							'info': 'verification successfull'
						});
					}
				})
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'verification successfull',
					'info': 'verification successfull'
				});
			}
		})
	}

	function registerUser(cb) {
		
		var account = {
			username: phone,
			phone: phone,
			role: 7,
			otp_validated: true
		};

		Account.register(
			new Account(account), 
			phone, 
			function(err) {
	        	cb(err);
	    });
	}
}