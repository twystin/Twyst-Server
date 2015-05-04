'use strict';
var fs = require('fs'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Handlebars = require('handlebars');
var Account = mongoose.model('Account');
var WelcomeEmail = require('../welcome_email_sms');

var keygen = require('keygenerator');

require('../../models/authtoken.mdl.js');
var AuthToken = mongoose.model('AuthToken');

var	SMS = require('../../common/smsSender');
var OTP = mongoose.model('TempOTP');

var Helper = require('../../common/utilities');
var DateHelper = require('../../common/date_helpers.js');
var HttpHelper = require('../../common/http_helpers.js');

module.exports.login = function(req, res) {
  var token = keygen.session_id();
  var auth_token = new AuthToken({
    token: token,
    expiry: new Date(),
    account: req.user._id,
    user: req.user.user
  });

  auth_token.save(function(err) {
    HttpHelper.response({
      response: res,
      error: err,
      success_data: token,
      success_message: "Successfully logged in the user.",
      error_data: err,
      error_message: "Could not save the OAuth token. Try again."
    });
  });
};


module.exports.getOTP = function (req, res) {

	var phone = req.params.phone;
	if(!phone || !Helper.isAPhone(phone)) {
    HttpHelper.response({
      response: res,
      error: true,
      error_data: null,
      error_message: "Need a phone number to send an OTP code."
    });
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
        HttpHelper.response({
          response: res,
          error: true,
          error_data: err,
          error_message: "Internal database error. Try again."
        });
			}
			else {
				if(otp) {
					var time_diff_last_otp = DateHelper.time_diff(otp.created_at);
          if (!time_diff_last_otp) {
            HttpHelper.response({
              response: res,
              error: true,
              error_data: null,
              error_message: "Previous OTP was malformed."
            });
          } else {
            if (time_diff_last_otp < DateHelper.common._5min) {
              HttpHelper.response({
                response: res,
                error: true,
                error_data: null,
                error_message: "A verification code has already been sent. Please check your messages."
              });
            } else {
              if(time_diff_last_otp > DateHelper.common.day) {
    						genOtp(otp, true);
    					} else {
    						genOtp(otp, false);
    					}
            }
          }
				}
				else {
					genOtp(null, true);
				}
			}
		});
	}

	function genOtp(otp_data, send_new) {
	  if(!otp_data) {
			otp_data = {
				'phone': phone,
				'otp': keygen.number({length: 4})
			};
			otp_data = new OTP(otp_data);
		}
		else if(send_new) {
				otp_data.otp = keygen.number({length: 4});
		}
		otp_data.created_at = Date.now();
		saveOtp(otp_data);
	}

	function saveOtp(otp_data) {
		var otp_message = 'Your Twyst verification code is ';
		delete otp_data.__v;
		otp_data.save(function (err) {
      if (!err) {
        otp_message += otp_data.otp;
				SMS.sendSms(phone, otp_message, 'OTP_MESSAGE');
      }

      HttpHelper.response({
        response: res,
        error: err,
        success_data: null,
        success_message: "The verification code has been sent to you",
        error_data: err,
        error_message: "Error processing verification code. Try again."
      });
		});
	}
};

module.exports.validateOtp = function (req, res) {
	var twyst_welcome_message = 'Welcome To Twyst Rewards Program';
	var otp = req.body.otp,
		phone = Helper.tenDigitPhone(req.body.phone);

	if(otp && phone) {
		otp += '';
		phone += '';
		validateOtp();
	}
	else {
    HttpHelper.response({
      response: res,
      error: true,
      error_data: null,
      error_message: "Request requires phone and verification code."
    });
	}

	function validateOtp() {
		OTP.findOne({
			phone: phone,
			otp: otp
		})
		.exec(function (err, otp) {
			if(err) {
        HttpHelper.response({
          response: res,
          error: true,
          error_data: err,
          error_message: "Error getting verification code."
        });
			}
			else if(!otp) {
        HttpHelper.response({
          response: res,
          error: true,
          error_data: null,
          error_message: "Incorrect verification code."
        });
			}
			else {
				processUser();
			}
		});
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
        HttpHelper.response({
          response: res,
          error: true,
          error_data: err,
          error_message: "Error getting user."
        });
			}
			else if(!user) {
				registerUser(function (err, user) {
          HttpHelper.response({
            response: res,
            error: err,
            success_data: null,
            success_message: "Successfully verified and created the user.",
            error_data: err,
            error_message: "Error registering user. Try again."
          });
				});
			}
			else {
				updateUser(user, function (err) {
          HttpHelper.response({
            response: res,
            error: err,
            success_data: null,
            success_message: "Successfully verified and updated the user.",
            error_data: err,
            error_message: "Error updating the user. Try again."
          });
				});
			}
		});
	}

	function updateUser(user, cb) {
		user.role = 7;
		delete user.__v;
		user.save(function (err) {
			cb(err);
		});
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
};
