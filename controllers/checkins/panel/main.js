var async = require('async');
var superagent = require('superagent');
var agent1 = superagent.agent();
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
var util = require('util');

function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 


module.exports.poscheckin = poscheckin = function(req,res){

//	console.log(req.body.outlet);
//	console.log(req.body.rows)
	var rows = JSON.parse(req.body.rows);
	var count = req.body.count;
	console.log(rows);
	async.waterfall([
                function one(callback) {
                    agent1
                        .post('http://localhost:3000/api/v1/auth/login')
                        .type('form') // send request in form format
                        .send({
                            username: 'theakitchen',
                            password: 'theakitchen'
                        })
                        .end(function(err, res) {
                            console.log("response for login is ", res.statusCode);
                            callback();
                        });
                        
                },

                function two(callback) {
                    for (var i = 0; i < count; i++) {
                        console.log("i is ", i);
                        var p = rows[i].Payment;
                        var m = rows[i].Mobile;
                        console.log(p);
                        console.log(m);
                        console.log(p, validatePayment(p),m,validateMobile(m));
                        if (validatePayment(rows[i].Payment) == true && validateMobile(rows[i].Mobile) == true && i!=0) {
                            console.log(rows[i].CustomerID,rows[i].Payment,rows[i].Mobile,rows[i].Email);
                            agent1
                                .post('http://localhost:3000/api/v2/checkins')
                                .send({
                                    //phone: "8860377473",
                                    phone: rows[i].Mobile,
                                    outlet: req.body.outlet
                                        //outlet: "rishi84902bc583c21000004"
                                })
                                .end(function(err, res) {
                                    //console.log(i);
                                    //log.info("response for checkins is ", res.statusCode, "for customerid ");
                                    console.log("response for checkins is ", res.statusCode, "for customerid ");
                                    callback();
                                });
                        }
                        else{
//                            log.info("validation failed for CustomerID");
                            console.log("validation failed for CustomerID ");
                        }
                    }
                    
                }], 
                function(err, results) { 
                	responder("200","recieved");
                    //console.log(results); 
                }
        );
	function responder(statusCode, message){
//		res.send("200","recieved");
		res.send(statusCode, message);
	}

	function validateMobile(data) {
    if (data.length < 10 || data.length > 12) {
        return false;
    }
    var lastTenChar = data.charAt(data.length - 10);
    if (lastTenChar == "7" || lastTenChar == "8" || lastTenChar == "9") {
        return true;
    }
    return false;
}

function validatePayment(data) {
    var x = Math.floor(data);
    if (x >= 100) {
        return true;
    } else {
        return false;
    }
}
}
module.exports.checkin = checkin = function(req, res) {
	if ((JSON.stringify(req.body.phone)).length==12 && !(isNumber(JSON.stringify(req.body.phone)))){
	initCheckin(req.body, function (success_object) {
		if(success_object.sms) {
			SMS.sendSms(req.body.phone, success_object.sms);
		}
		responder(success_object.res.statusCode, success_object.res.message);
	});
	}
	else{
		responder("400","Invalid Mobile Number");
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

	checkin.created_date = CommonUtilities.setCurrentTime(checkin.created_date);

	q.checkin_time = checkin.created_date;
	checkin.checkin_type = "PANEL";
	checkin.checkin_code = "PANEL";

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
			var message = '';
			if(q.batch_user) {
				message = q.message;
				message = message.replace(/code xxxxxx/g, 'code ' + voucher.basics.code);
				message = message.replace(/URL/g, 'http://twyst.in/download/%23/'+ q.phone);
			}
			else if(sms.checkin && sms.reward && isNewUser()) {
				message = 'Welcome to the '+ outlet.basics.name +' loyalty program on Twyst. You have checked-in on '+ CommonUtilities.formatDate(new Date(checkin.created_date)) +' and unlocked a reward at '+ outlet.basics.name +'. Voucher code is '+ voucher.basics.code +'. '+ CommonUtilities.rewardify(reward) +', valid '+ Helper.getDOW(reward.reward_applicability.day_of_week) +', '+ Helper.getTOD(reward.reward_applicability.time_of_day) +', until '+ CommonUtilities.formatDate(new Date(voucher.validity.end_date)) +'. Terms- '+ reward.terms +'. To claim, please show this SMS to the outlet staff on your NEXT VISIT.';
			}
			else if(sms.checkin && sms.reward && !isNewUser()) {
				message = 'Reward unlocked at '+ outlet.basics.name +'. Voucher code is '+ voucher.basics.code +'. '+ CommonUtilities.rewardify(reward) +', valid '+ Helper.getDOW(reward.reward_applicability.day_of_week) +', ' +  Helper.getTOD(reward.reward_applicability.time_of_day) + ', until '+ CommonUtilities.formatDate(new Date(voucher.validity.end_date)) +'. Terms- '+ reward.terms +'. To claim, please show this SMS to the outlet staff on your NEXT VISIT.';
			}
			else if(sms.checkin && !isNewUser()) {
				message = 'You have checked-in at '+ outlet.basics.name +' on '+ CommonUtilities.formatDate(new Date(checkin.created_date)) +'. You are '+ checkins_to_next_reward +' check-ins away from your next reward.';
			}
			else if(sms.checkin && isNewUser()) {
				message = 'Welcome to the '+ outlet.basics.name +' loyalty program on Twyst. You have checked-in on '+ CommonUtilities.formatDate(new Date(checkin.created_date)) +', and are '+ checkins_to_next_reward +' check-ins away from your next reward at '+ outlet.basics.name +'.';
			}
			sms.checkin = false;
			sms.reward = false;
			console.log(outlet.contact.location.locality_1[0].toLowerCase())
			if(outlet.contact.location.locality_1[0].toLowerCase() === 'huda city centre metro station') {
				message += ' Take part in the Metro Park Foodie Challenge, weekly meal vouchers worth up to Rs 1500 up for grabs! Click http://twyst.in/metropark for more.';
			}
			else {
				message += ' Click http://twy.st/app to get Twyst for your phone and stay connected with '+ outlet.basics.name +'.';
			}

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

		voucher.basics.created_at = CommonUtilities.setCurrentTime(
											checkin.created_date);
		
		voucher.basics.code = keygen._(
			{forceUppercase: true, length: 6, exclude:['O', '0', 'L', '1']});

		return voucher;
	}

} 