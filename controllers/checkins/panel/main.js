var _ = require('underscore');
var mongoose = require('mongoose');
var Helper = require('./helper');
var response = require('./response');
var SMS = require('../../../common/smsSender');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var keygen = require("keygenerator");

module.exports.checkin = function(req, res) {

	var checkin = {}, 
		q = {},
		history = {},
		applicable = {},
		reward = {},
		user = null;

	q.phone  = req.body.phone;
	q.outlet = req.body.outlet;
	// Get request body and save in Checkin object.
	_.extend(checkin, req.body);
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
				isValidCheckin(history.last);
			}
			else {
				createCheckin(checkin);
			}
		});
	};

	function isValidCheckin(last_checkin) {
		var diff = Date.now() - last_checkin.created_date;
		if(diff > 21600000) {
			createCheckin(checkin);
		}
		else {
			if(last_checkin.outlet.equals(q.outlet)) {
				
				responder(response.message.six_hours_error.statusCode, 
					response.message.six_hours_error);
			}	
			else {
				if(diff > 1800000) {
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
				reward = Helper.isRewardTime(applicable.tier, history.count);
				if(reward) {
					saveVoucher(reward);
				}
				else {
					SMS.sendSms(q.phone, response.sms.success.message);
					response.message.success.message = "User " + q.phone + ' has been checked-in successfully.';
					responder(response.message.success.statusCode, 
						response.message.success);
				}
			}
		});
	}

	function saveVoucher(reward) {
		var voucher = getVoucherDetails(reward);
		voucher = new Voucher(voucher);

		voucher.save(function(err, voucher) {
			if(err) {
				SMS.sendSms(q.phone, response.sms.success.message);
				response.message.success.message = "User " + q.phone + ' has been checked-in successfully.';
				responder(response.message.success.statusCode, 
						response.message.success);
			}
			else {
				SMS.sendSms(q.phone, response.sms.success.message);
				response.message.success.message = "User has been checked-in successfully. The user has also unlocked a reward.";
				responder(response.message.success.statusCode, 
						response.message.success);
			}
		});

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

		voucher.basics.code = keygen._(
			{forceUppercase: true, length: 6, exclude:['O', '0', 'L', '1']});

		return voucher;
	}

	function responder(statusCode, message) {
		res.send(statusCode, message);
	}

}