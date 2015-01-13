var async = require('async'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	keygen = require("keygenerator");
var Helper = require('./helper'),
	response = require('./response'),
	SMS = require('../../../common/smsSender'),
	Utils = require('../../../common/utilities');

var Checkin = mongoose.model('Checkin'),
	Voucher = mongoose.model('Voucher');

function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 

module.exports.checkin = checkin = function(req, res) {
	if ( req.body.phone 
		&& req.body.phone.length === 10 
		&& isNumber(req.body.phone)){
		
		initCheckin(req.body, function (success_object) {
			if(success_object.sms && success_object.sms.checkin) {
				SMS.sendSms(req.body.phone, success_object.sms.checkin, 'CHECKIN_MESSAGE');
			}
			if(success_object.sms && success_object.sms.reward) {
				SMS.sendSms(req.body.phone, success_object.sms.reward, 'VOUCHER_MESSAGE');
			}
			responder(success_object.res.statusCode, success_object.res.message);
		});
	}
	else {
		responder(response.message.invalid_mobile_number.statusCode, response.message.invalid_mobile_number);
	}
	
	function responder(statusCode, message) {
		res.send(statusCode, message);
	}
	
};

module.exports.initCheckin = initCheckin =  function(obj, callback) {
	var checkin = {}, 
		q = {},
		history = {},
		applicable = {},
		reward = null,
		user = null,
		sms = {},
		voucher = null;	

	var success = {
		'checkin': false,
		'voucher': null,
		'sms': null,
		'res': {
			'statusCode': null,
			'message': null
		}
	};

	sms.checkin = false;
	sms.reward = false;
	history.last = null;

	q.phone  = obj.phone;
	q.outlet = obj.outlet;
	q.batch_user = obj.batch_user || false;
	q.message = obj.message;
	// Get request body and save in Checkin object.
	checkin = _.extend(checkin, obj);
	var current_time = Date.now();

	checkin.created_date = Utils.setCurrentTime(checkin.created_date);

	q.checkin_time = checkin.created_date;
	checkin.checkin_type = checkin.checkin_type || "PANEL";
	checkin.checkin_code = checkin.checkin_code || "PANEL";

	Helper.getActiveProgram(q, function(data) {
		if(data) {
			q.program = data; 
			getCheckinHistory(q);
		}
		else {
			success.res.statusCode = response.message.program_error.statusCode;
			success.res.message = response.message.program_error;
			callback(success);
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
					success.res.statusCode = response.message.six_hours_error.statusCode;
					success.res.message = response.message.six_hours_error;
					callback(success);
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
				success.res.statusCode = response.message.six_hours_error.statusCode;
				success.res.message = response.message.six_hours_error;
				callback(success);
			}
			else {
				if(diff > 5 * 60 * 1000) {
					createCheckin(checkin);
				}
				else {
					success.res.statusCode = response.message.thirty_minutes_error.statusCode;
					success.res.message = response.message.thirty_minutes_error;
					callback(success);
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
				success.res.statusCode = response.message.error.statusCode;
				success.res.message = response.message.error;
				callback(success);
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
				success.res.statusCode = response.message.error.statusCode;
				success.res.message = response.message.error;
				callback(success);
			}
			else {
				sms.checkin = true;
				reward = Helper.isRewardTime(applicable.tier, history.count);
				if(reward) {
					saveVoucher(reward);
				}
				else {
					smsController(function (sms_msg) {
						response.message.success.message = "User " + q.phone + ' has been checked-in successfully.';
						success.res.statusCode = response.message.success.statusCode;
						success.res.message = response.message.success;
						success.sms = sms_msg;
						success.checkin = true;
						callback(success);
					});
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
				smsController(function (sms_msg) {
					response.message.success.message = "User " + q.phone + ' has been checked-in successfully.';
					success.res.statusCode = response.message.success.statusCode;
					success.res.message = response.message.success;
					success.sms = sms_msg;
					success.checkin = true;
					callback(success);
				});
			}
			else {
				sms.reward = true;
				smsController(function (sms_msg) {
					response.message.success.message = "User "+ q.phone + " has been checked-in successfully. The user has also unlocked a reward.";
					success.res.statusCode = response.message.success.statusCode;
					success.res.message = response.message.success;
					success.sms = sms_msg;
					success.checkin = true;
					success.voucher = voucher;
					callback(success);
				});
				
			}
		});

	}

	function smsController(cb) {
		var outlet = null;
		Helper.getOutlet(q.outlet, function (o) {
			if(o) {
				outlet = o;
				cb(getMessages());
			}
			else {
				cb(null);
			}
		});

		var checkins_to_next_reward = Helper.getNext(history.count, q.program);

		function getMessages() {
			var message = {
				'checkin': null,
				'reward': null
			};
			if(q.batch_user) {
				message.checkin = q.message;
				if(voucher) {
					message.checkin = message.checkin.replace(/xxxxxx/g, voucher.basics.code);
				}
				message.checkin = message.checkin.replace(/URL/g, 'http://twyst.in/download/%23/'+ q.phone);
			}
			else if(sms.checkin && sms.reward && isNewUser()) {
				message.checkin = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst!. Check-in successful on '+ Utils.formatDate(new Date(checkin.created_date)) +'. Reward unlocked - yay! You will soon receive your voucher code via SMS. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
				message.reward = 'Your Twyst voucher code at '+ outlet.basics.name +' is '+ voucher.basics.code +'. '+ Utils.rewardify(reward) +'. Terms- '+ reward.terms +'. VALID UNTIL '+ Utils.formatDate(new Date(voucher.validity.end_date)) +'. Track and redeem your rewards easily, get Twyst http://twy.st/app';
			}
			else if(sms.checkin && sms.reward && !isNewUser()) {
				message.checkin = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(checkin.created_date)) +'. Reward unlocked - yay! You will soon receive your voucher code via SMS. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
				message.reward = 'Your Twyst voucher code at '+ outlet.basics.name +' is '+ voucher.basics.code +'. '+ Utils.rewardify(reward) +'. Terms- '+ reward.terms +'. VALID UNTIL '+ Utils.formatDate(new Date(voucher.validity.end_date)) +'. Track and redeem your rewards easily, get Twyst http://twy.st/app';
			}
			else if(sms.checkin && !isNewUser()) {
				message.checkin = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(checkin.created_date)) +'. You are '+ checkins_to_next_reward +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
			}
			else if(sms.checkin && isNewUser()) {
				message.checkin = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst!. Check-in successful on '+ Utils.formatDate(new Date(checkin.created_date)) +'. You are '+ checkins_to_next_reward +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
			}
			if(outlet.basics.slug === 'fruitpress') {
				message.checkin += " Enjoy all new winter specials at Fruit Press – hot chai, coffee, soups and more!";
			}
			if(outlet.basics.slug === 'strikerpubbrewery'
				|| outlet.basics.slug === 'strikerpubkitchen') {
				message.checkin += " Adda by Striker at Sec-29 now open! Call 9811118182 for details.";
			}
			sms.checkin = false;
			sms.reward = false;

			return message;
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
		var voucher_valid_from = new Date(checkin.created_date).getTime() + 10800000;
		voucher_valid_from = new Date(voucher_valid_from);

		voucher.basics.created_at = Utils.setCurrentTime(voucher_valid_from);
		
		voucher.basics.code = keygen._(
			{forceUppercase: true, length: 6, exclude:['O', '0', 'L', '1']});

		return voucher;
	}

} 