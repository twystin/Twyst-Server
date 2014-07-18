var _ = require('underscore');
var mongoose = require('mongoose');
var Helper = require('./helper');
var response = require('./response');
var SMS = require('../../../common/smsSender');
var CommonUtilities = require('../../../common/utilities');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var keygen = require("keygenerator");
var UserDataCtrl = require('../../user/userDataCtrl');

module.exports.checkin = function(req, res) {

	var checkin = {}, 
		q = {},
		history = {},
		applicable = {},
		reward = null,
		user = null,
		sms = {},
		voucher = null;		

	sms.checkin = false;
	sms.reward = false;
	history.last = null;

	q.phone  = req.body.phone;
	q.outlet = req.body.outlet;
	q.batch_user = req.body.batch_user || false;
	q.message = req.body.message;
	// Get request body and save in Checkin object.
	_.extend(checkin, req.body);
	var current_time = Date.now();

	checkin.created_date = CommonUtilities.setCurrentTime(checkin.created_date) || Date.now();
	q.checkin_time = checkin.created_date;
	checkin.checkin_type = "PANEL";
	checkin.checkin_code = "PANEL";

	Helper.getActiveProgram(q, function(data) {
		if(data) {
			q.program = data; 
			getCheckinHistory(q);
		}
		else {
			responder(response.message.program_error.statusCode, 
				response.message.program_error);
		}
	});

	function getCheckinHistory(query) {
		Helper.getCheckinHistory(query, function(data) {
			history = data;
			if(history.last) {
				isValidCheckin(history.last_checkin, history.last_checkin_today);
			}
			else {
				createCheckin(checkin);
			}
		});
	};

	function isValidCheckin(last_checkin, last_checkin_today) {
		var diff = Date.now() - last_checkin.created_date;
		var diff2 = checkin.created_date - current_time;
		if(diff2 < 0) {
			if(last_checkin_today) {
				if(last_checkin_today.outlet.equals(q.outlet)) {
					responder(response.message.six_hours_error.statusCode, 
						response.message.six_hours_error);
				}
				else {
					createCheckin(checkin);
				}
			}
			else {
				createCheckin(checkin);
			}
		}
		else if(diff > 6 * 30 * 60 * 1000) {
			createCheckin(checkin);
		}
		else {
			if(last_checkin.outlet.equals(q.outlet)) {
				
				responder(response.message.six_hours_error.statusCode, 
					response.message.six_hours_error);
			}
			else {
				if(diff > 30 * 60 * 1000) {
					createCheckin(checkin);
				}
				else {
					responder(response.message.thirty_minutes_error.statusCode, 
						response.message.thirty_minutes_error);
				}
			}
		}
	}

	function isUserRegistered (cb) {

		Helper.isUserRegistered(q, function (data) {
			if(data) {
				user = data;
				cb(true);
			}
			else {
				cb(false);
			}
		});
	}

	function createCheckin(checkin) {
		isUserRegistered(function (data) {
			if(data) {
				saveCheckin(checkin);
			}
			else {
				// Error in User registeration ()
				responder(response.message.error.statusCode, 
						response.message.error);
			}
		});
	}

	function getCheckinObject() {
		
		checkin.checkin_program = q.program;
		checkin.checkin_tier = applicable.tier;
		checkin.checkin_for = applicable.offer;
		checkin.checkin_date = Date.now();
		if(q.batch_user) {
			checkin.checkin_code = 'BATCH';
			checkin.checkin_type = "BATCH";
		}
		return new Checkin(checkin);
	}

	function saveCheckin(checkin) {
		applicable = Helper.getApplicableOffer(q.program, history.count);
		checkin = getCheckinObject();

		checkin.save(function (err, checkin) {
			if(err) {
				responder(response.message.error.statusCode, 
						response.message.error);
			}
			else {
				sms.checkin = true;
				reward = Helper.isRewardTime(applicable.tier, history.count);
				if(reward) {
					saveVoucher(reward);
				}
				else {
					smsController();
					response.message.success.message = "User " + q.phone + ' has been checked-in successfully.';
					responder(response.message.success.statusCode, 
						response.message.success);
				}
			}
		});
	}

	function saveVoucher(reward) {
		voucher = getVoucherDetails(reward);
		voucher = new Voucher(voucher);

		voucher.save(function(err, voucher) {
			if(err) {
				sms.checkin = true;
				smsController();
				response.message.success.message = "User " + q.phone + ' has been checked-in successfully.';
				responder(response.message.success.statusCode, 
						response.message.success);
			}
			else {
				sms.reward = true;
				smsController();
				response.message.success.message = "User "+ q.phone + " has been checked-in successfully. The user has also unlocked a reward.";
				responder(response.message.success.statusCode, 
						response.message.success);
			}
		});

	}

	function smsController() {
		var outlet = null;
		Helper.getOutlet(q.outlet, function (o) {
			if(o) {
				outlet = o;
				getMessages();
			}
			else {
				console.log("Error here. Outlet not found.")
			}
		});

		var checkins_to_next_reward = Helper.getNext(history.count, q.program);

		function getMessages() {
			var message = '';
			if(q.batch_user) {
				message = q.message;
				message = message.replace(/code xxxxxx/g, 'code ' + voucher.basics.code);
				message = message.replace(/URL/g, 'http://twyst.in/download/%23/'+ q.phone);
			}
			else if(sms.checkin && sms.reward && isNewUser()) {
				message = 'Welcome to the '+ outlet.basics.name +' loyalty program on Twyst. You have checked-in on '+ CommonUtilities.formatDate(new Date(checkin.created_date)) +' and unlocked a reward at '+ outlet.basics.name +'. Voucher code is '+ voucher.basics.code +'. '+ CommonUtilities.rewardify(reward) +', valid '+ Helper.getDOW(reward.reward_applicability.day_of_week) +', '+ Helper.getTOD(reward.reward_applicability.time_of_day) +', until '+ CommonUtilities.formatDate(new Date(voucher.validity.end_date)) +'. Terms- '+ reward.terms +'. To claim, please show this SMS to the outlet staff. Click http://twyst.in/download/%23/'+ q.phone +' to get Twyst for Android and stay connected with '+ outlet.basics.name +'.';
			}
			else if(sms.checkin && sms.reward && !isNewUser()) {
				message = 'Reward unlocked at '+ outlet.basics.name +'. Voucher code is '+ voucher.basics.code +'. '+ CommonUtilities.rewardify(reward) +', valid '+ Helper.getDOW(reward.reward_applicability.day_of_week) +', ' +  Helper.getTOD(reward.reward_applicability.time_of_day) + ', until '+ CommonUtilities.formatDate(new Date(voucher.validity.end_date)) +'. Terms- '+ reward.terms +'. To claim, please show this SMS to the outlet staff. Click http://twyst.in/download/%23/'+ q.phone +' to get Twyst for Android and stay connected with '+ outlet.basics.name +'.';
			}
			else if(sms.checkin && !isNewUser()) {
				message = 'You have checked-in at '+ outlet.basics.name +' on '+ CommonUtilities.formatDate(new Date(checkin.created_date)) +'. You are '+ checkins_to_next_reward +' check-ins away from your next reward. Click http://twyst.in/download/%23/'+ q.phone +' to get Twyst for Android and stay connected with '+ outlet.basics.name +'.';
			}
			else if(sms.checkin && isNewUser()) {
				message = 'Welcome to the '+ outlet.basics.name +' loyalty program on Twyst. You have checked-in on '+ CommonUtilities.formatDate(new Date(checkin.created_date)) +', and are '+ checkins_to_next_reward +' check-ins away from your next reward at '+ outlet.basics.name +'. Click http://twyst.in/download/%23/'+ q.phone +' to get Twyst for Android and stay connected with '+ outlet.basics.name +'.';
			}
			sms.checkin = false;
			sms.reward = false;
			SMS.sendSms(q.phone, message);
		}
	}

	function isNewUser() {
		if(history.count > 0) {
			return false;
		}
		return true;
	}

	function getVoucherDetails (reward) {
		var voucher = {};
		voucher.issue_details = {};
		voucher.basics = {};
		voucher.validity = {};
		
		//Validity for voucher
		voucher.validity.start_date = q.program.validity.burn_start;
		voucher.validity.end_date = q.program.validity.burn_end;
		
		// Issue details
		voucher.issue_details.issued_at = [];
		if(q.program.outlets.length > 0) {
			voucher.issue_details.issued_at = q.program.outlets.slice();
		}
		voucher.issue_details.issued_to = user._id;
		voucher.issue_details.program = q.program._id;
		voucher.issue_details.tier = applicable.tier._id;
		voucher.issue_details.issued_for = reward._id;

		if(reward.basics && reward.basics.description) {
			voucher.basics.description = reward.basics.description;
		}

		voucher.basics.created_at = CommonUtilities.setCurrentTime(
											checkin.created_date);

		voucher.basics.code = keygen._(
			{forceUppercase: true, length: 6, exclude:['O', '0', 'L', '1']});

		return voucher;
	}

	function responder(statusCode, message) {
		res.send(statusCode, message);
	}

} 