var mongoose = require('mongoose');
var Program = mongoose.model('Program');
var Checkin = mongoose.model('Checkin');
var Account = mongoose.model('Account');
var Voucher = mongoose.model('Voucher');
var Tier = mongoose.model('Tier');
var Offer = mongoose.model('Offer');
var keygen = require("keygenerator");
var _ = require('underscore');
var SmsSentLog = mongoose.model('SmsSentLog');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

var global_sms_flag = false;

module.exports.readProgramAndPopulateTiers = function(outlet_id, phone, sms_flag) {
	
	global_sms_flag = sms_flag;

	Program.findOne({outlets: outlet_id, status: 'active'}).populate('tiers').exec(function (err, program) {
		if(err) {
			console.log("No program found to generate Voucher");
		}
		else {
			if(program === null) {
				console.log("No program found to generate Voucher");
			}
			else {
				populateOffers(program, outlet_id, phone);
			}
		}
	});
}

function populateOffers (program, outlet_id, phone) {
	var tiers = [];
	var tier_count = program.tiers.length;
	program.tiers.forEach(function (tier) {
		Tier.findOne({_id: tier._id}).populate('offers').exec(function (err, tier) {
			if(err) {
				console.log("Unable to find tier");
				console.log(err);
				tier_count--;
			}
			else {
				if(tier === null) {
					tier_count--;
				}
				else {
					tiers.push(tier);
					tier_count--;
				}
			}
			if (tier_count === 0) {
				program.tiers = tiers;
				countCheckinforUser(program, outlet_id, phone);
			}
		})
	})
}

function countCheckinforUser(program, outlet_id, phone) {
	
	Checkin.count({phone: phone, checkin_program: program._id}, function (err, count) {
		if(err) {
			console.log("Error getting count of checkins");
			console.log(err);
		}
		else {
			decideTier(program, outlet_id, phone, count);
		}
	});
}

function decideTier(program, outlet_id, phone, count) {
	var marked_tier;
	var tier_count = program.tiers.length;
	if(tier_count > 0) {
		program.tiers.forEach(function (tier) {
			if((Number(tier.basics.start_value) <= count) && (Number(tier.basics.end_value) >= count)) {
				marked_tier = tier;
			}
		});
		if(marked_tier && marked_tier.offers.length > 0) {
			var in_tier_checkin_count = count - marked_tier.basics.start_value+1;
			if(in_tier_checkin_count > 0) {
				decideOffer(program, marked_tier, outlet_id, phone, count, in_tier_checkin_count);
			}
		}
	}
}

function decideOffer(program, marked_tier, outlet_id, phone, total_checkin_count, in_tier_checkin_count) {
	var offer_count = marked_tier.offers.length;
	var marked_offer;
	marked_tier.offers.forEach(function (offer) {
		if(offer.user_eligibility) {
			if(offer.user_eligibility.criteria) {
				if(offer.user_eligibility.criteria.condition === 'on only') {
					if(Number(offer.user_eligibility.criteria.value) === total_checkin_count) {
						findUserId(program, marked_tier, phone, outlet_id, offer);
					}
				}
				if(offer.user_eligibility.criteria.condition === 'after') {
					if(Number(offer.user_eligibility.criteria.value) <= total_checkin_count) {
						findUserId(program, marked_tier, phone, outlet_id, offer);
					}
				}
				if(offer.user_eligibility.criteria.condition === 'on every') {
					if(in_tier_checkin_count % Number(offer.user_eligibility.criteria.value) === 0) {
						findUserId(program, marked_tier, phone, outlet_id, offer);
					}
				}
			}
		}		
	});
}

function findUserId(program, tier, phone, outlet_id, offer) {
	var voucher = {};
	voucher.issue_details = {};
	voucher.basics = {};
	voucher.validity = {};
	Account.findOne({phone: phone}, function (err, user) {
		if(err) {
			// No such user
			console.log("User not found");
		}
		else {
			if(user === null) {
				console.log("User not found");
			}
			else {
				voucher.validity.start_date = program.validity.burn_start;
				voucher.validity.end_date = program.validity.burn_end;
				voucher.issue_details.issued_at = [];
				if(program.outlets.length > 0) {
					voucher.issue_details.issued_at = program.outlets.slice();
				}
				voucher.issue_details.issued_to = user._id;
				voucher.issue_details.program = program._id;
				voucher.issue_details.tier = tier._id;
				voucher.issue_details.issued_for = offer._id;
				if(offer.basics && offer.basics.description) {
					voucher.basics.description = offer.basics.description;
				}
				generateVoucher(voucher, phone);
			}
		}
	})

}

function generateVoucher(voucher, phone) {
	voucher.basics = voucher.basics || {};
	voucher.basics.code = keygen._({forceUppercase: true, length: 6, exclude:['O', '0', 'L', '1']});

	var voucher = new Voucher(voucher);
	voucher.save(function (err, voucher) {
		if(err) {
			console.log(err);
			console.log("Error saving Voucher")
		}
		else {
			console.log("Voucher Successfully generated");
			
			if(global_sms_flag) {
				getVoucherDetails(voucher.basics.code, phone);
				global_sms_flag = false;
			}
		}
	});
}

function getLastCheckin(code, phone) {
	
	Checkin.findOne({phone: phone}, {}, { sort: { 'created_date' : -1 } }).populate('outlet').exec(function (err, checkin) {
		if(err || checkin === null) {
			getVoucherDetails(code, phone, null);
		}
		else {
			getVoucherDetails(code, phone, checkin.outlet.basics.name);
		}
	});
}

function getVoucherDetails(code, phone, outlet_name) {
	
	Voucher.findOne({'basics.code': code})
        .populate('issue_details.issued_at')
        .populate('issue_details.program')
        .populate('issue_details.issued_for')
        .exec(function (err, voucher) {
        if(err || voucher === null) {
            console.log("Error getting voucher details");
        }
        else {
        	if(!outlet_name) {
        		outlet_name = voucher.issue_details.issued_at[0].basics.name;
        	}
        	var push_message = 'You have unlocked a reward at '+outlet_name+'. Your voucher code is '+voucher.basics.code+'. Reward is '+voucher.basics.description+', valid '+getCheckinApplicabilityDay(voucher.issue_details.issued_for.reward_applicability.day_of_week)+', '+getCheckinApplicabilityTime(voucher.issue_details.issued_for.reward_applicability.time_of_day)+', until '+voucher.validity.end_date+'. Terms- '+voucher.issue_details.issued_for.terms+'. To claim, please show this SMS to the outlet staff. '+voucher.basics.code+'.';

        	responder(phone, push_message);
        }
    });
}

function responder(phone, push_message) {

	saveSentSms (phone, push_message);

	var message = push_message.replace('&','n');
	console.log("SMS sent");
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

function getCheckinApplicabilityDay (array) {
	
    for(var i = 0; i < array.length; i++ ) {
    	if(array[i] !== 'all days') {
            return 'on '+array.join(',');
        }
        if(array[i] === 'all days') {
            return 'on all days of the week';
        }
    };
}

function getCheckinApplicabilityTime (array) {
	
    for(var i = 0; i < array.length; i++ ) {

        if(array[i] !== 'all day') {
            return 'at '+array.join(',');
        }
        if(array[i] === 'all day') {
            return 'all day long';
        }
    };
}
