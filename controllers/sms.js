var mongoose = require('mongoose');
var Checkin = mongoose.model('Checkin');
var Qr = mongoose.model('Qr');
var Account = mongoose.model('Account');
var VoucherGenCtrl = require('../controllers/voucher-gen');
var Program = mongoose.model('Program');
var Outlet = mongoose.model('Outlet');
var SmsSentLog = mongoose.model('SmsSentLog');
var Tier = mongoose.model('Tier'); 

var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');

var global_qr = null;
var global_new_user = false;

module.exports.smsCheckin = function(req, res, phone, code, checkin_type, checkin_code) {
	
	isUserRegistered ();
	global_new_user = false;

	function isUserRegistered () {
		Account.findOne({phone: phone}, function (err, user) {
			if(err || user === null) {
				createNewUser();
			}
			else {
				getQr();
			}
		})
	}

	function createNewUser() {

		Account.register(new Account({ username : phone, phone: phone, role: 6}), phone, function(err, account) {
	        if (err) {
	            console.log(err);
	        } else {
	            getQr();
	        }
	    });
	}


	global_qr = null;

	function getQr() {
		Qr.findOne({code: code}, function (err, qr) {
			if(err) {
				var push_message = 'Sorry, check-in unsuccessful. This code is invalid. Please try again with a valid code.';
				responder(phone, push_message);
			}
			else {
				if(qr !== null) {
					global_qr = qr;
					validateQrCode(qr, req, res, phone, code, checkin_type, checkin_code);
				}
				else {
					var push_message = 'Sorry, check-in unsuccessful. This code is invalid. Please try again with a valid code.';
					responder(phone, push_message);
				}
			}
		});
	}
}; 

function validateQrCode (qr, req, res, phone, code, checkin_type, checkin_code) {

	if(qr.times_used < qr.max_use_limit) {
		if(qr.validity.start && qr.validity.end) {
			if(qr.validity.start < Date.now() && qr.validity.end > Date.now()) {
				
				checkValidCheckin(qr, req, res,  phone, code, checkin_type, checkin_code);
			}
			else {
				var push_message = 'Sorry, check-in unsuccessful. This code has expired. Please try again with a valid code.';
				responder(phone, push_message);			
			}
		}
		else {
			var push_message = 'Sorry, check-in unsuccessful. This code has expired. Please try again with a valid code.';
			responder(phone, push_message);	
		}
	}
	else {
		var push_message = 'Sorry, check-in unsuccessful. This code has expired. Please try again with a valid code.';
		responder(phone, push_message);	
	}
}

function checkValidCheckin(qr, req, res, phone, code, checkin_type, checkin_code) {

	if(qr.type === 'single') {
		detect();
	}
	else {
		onValidRequest(qr, req, res, phone, code, checkin_type, checkin_code);
	}

	function detect() {
		Checkin.findOne({checkin_code: qr.code, phone: phone}, function(err, checkin) {
			console.log(err || checkin);
			if(err) {
				var push_message = 'Sorry, there was an error saving your check-in. Please try again with the same code.';
				responder(phone, push_message);
			}
			else if(checkin === null) {
				onValidRequest(qr, req, res, phone, code, checkin_type, checkin_code);
			}
			else {
				var push_message = 'Sorry, you have already used this code to check-in. Please try again with a different code.';
				responder(phone, push_message);
			}
		});
	}
}

function updateQrUsedDetails(qr) {

	Qr.findOne({_id: qr._id}, function (err, qr) {
		if(err) {
			// Do nothing
		}
		else {
			if(qr !== null) {
				qr.times_used += 1;
				qr.save();
			}
		}
	})
}

function onValidRequest(qr, req, res,  phone, code, checkin_type, checkin_code) {
	var created_checkin = {};

	if(qr.outlet_id) {
		created_checkin.outlet = qr.outlet_id;
		created_checkin.phone = phone;
		created_checkin.checkin_type = checkin_type;
		created_checkin.checkin_code = qr.code;

		detectSixHoursCap(qr, req, res, created_checkin.outlet, 
			created_checkin.phone, 
			created_checkin.checkin_type,
			created_checkin.checkin_code);

	}
		
	else {
		var push_message = 'Sorry, check-in unsuccessful. This code is invalid. Please try again with a valid code.';
		responder(phone, push_message);
	}
}

function detectSixHoursCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code) {
	
	Checkin.findOne({phone: phone, outlet: outlet_id}, {}, { sort: { 'created_date' : -1 } }, function(err, checkin) {
		if(err) {
			detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code)
		}
		if(checkin === null) {
			detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code)
		}
		else {
			var diff = Date.now() - checkin.created_date;
			
			if(diff > 21600000) {
				detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code)
			}
			else {
				var push_message = 'We have already logged your check-in here. Please check-in again on your next visit or order.';
				responder(phone, push_message);
			}
		}
	});
}

function detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code) {
	
	Checkin.findOne({phone: phone}, {}, { sort: { 'created_date' : -1 } }, function(err, checkin) {
		if(err) {
			create(req, res, outlet_id, phone, checkin_type, checkin_code);
		}
		if(checkin === null) {
			create(req, res, outlet_id, phone, checkin_type, checkin_code);
		}
		else {
			var diff = Date.now() - checkin.created_date;

			if(diff > 1800000) {
				create(req, res, outlet_id, phone, checkin_type, checkin_code);
			}
			else {
				var push_message = 'You have checked-in recently somewhere else. Please try checking-in here after some time.';
				responder(phone, push_message);
			}
		}
	});
}

function create (req, res, outlet_id, phone, checkin_type, checkin_code) {

	Program.findOne({outlets: outlet_id, status: 'active'}).populate('tiers').exec(function (err, program) {
		if(program === null || err) {
			var checkin = {};
			checkin.outlet = outlet_id;
			checkin.phone = phone;
			checkin.checkin_code = checkin_code;
			checkin.checkin_type = checkin_type;
			createCheckin(req, res, checkin);
		}
		else {
			populateOffers(req, res, program, outlet_id, phone, checkin_type, checkin_code);
		}
	})
}

function populateOffers (req, res, program, outlet_id, phone, checkin_type, checkin_code) {
	var tiers = [];
	var tier_count = program.tiers.length;
	program.tiers.forEach(function (tier) {
		Tier.findOne({_id: tier._id}).populate('offers').exec(function (err, tier) {
			if(err) {
				
				tier_count--;
				if (tier_count === 0) {
					program.tiers = tiers;
					countCheckinforUser(req, res, program, outlet_id, phone, checkin_type, checkin_code);
				}
			}
			else {
				if(tier === null) {
					tier_count--;
				}
				else {
					tiers.push(tier);
					tier_count--;
				}
				if (tier_count === 0) {
					program.tiers = tiers;
					countCheckinforUser(req, res, program, outlet_id, phone, checkin_type, checkin_code);
				}
			}
		})
	})
}

function countCheckinforUser(req, res, program, outlet_id, phone, checkin_type, checkin_code) {
	
	Checkin.count({phone: phone, checkin_program: program._id}, function (err, count) {
		if(err) {
			var checkin = {};
			checkin.outlet = outlet_id;
			checkin.phone = phone;
			checkin.checkin_program = program;
			checkin.checkin_code = checkin_code;
			checkin.checkin_type = checkin_type;
			createCheckin(req, res, checkin);
		}
		else {
			if(count === 0) {
				global_new_user = true;
			}
			decideTier(req, res, program, outlet_id, phone, count, checkin_type, checkin_code);
		}
	});
}

function decideTier(req, res, program, outlet_id, phone, count, checkin_type, checkin_code) {
	var marked_tier;
	var offer_count;
	var tier_count = program.tiers.length;
	// TODO FIX THIS
	if(count === 0) {
		count += 1;
	}
	program.tiers.forEach(function (tier) {
		if((Number(tier.basics.start_value) <= count) && (Number(tier.basics.end_value) >= count)) {
			marked_tier = tier;
			offer_count = marked_tier.offers.length;
		}
	});
	if(marked_tier) { 
		if(offer_count > 0) {
			decideOffer(req, res, program, marked_tier, outlet_id, phone, count, checkin_type, checkin_code);
		}
		else {
			var checkin = {};
			checkin.outlet = outlet_id;
			checkin.phone = phone;
			checkin.checkin_program = program;
			checkin.checkin_tier = marked_tier;
			checkin.checkin_code = checkin_code;
			checkin.checkin_type = checkin_type;
			createCheckin(req, res, checkin);
		}
	}
	else {
		var checkin = {};
		checkin.outlet = outlet_id;
		checkin.phone = phone;
		checkin.checkin_program = program;
		checkin.checkin_code = checkin_code;
		checkin.checkin_type = checkin_type;
		createCheckin(req, res, checkin);
	}
}

function decideOffer(req, res, program, marked_tier, outlet_id, phone, count, checkin_type, checkin_code) {

	var checkin = {};
	checkin.outlet = outlet_id;
	checkin.phone = phone;
	checkin.checkin_program = program;
	checkin.checkin_tier = marked_tier;
	checkin.checkin_code = checkin_code;
	checkin.checkin_type = checkin_type;
	
	if(marked_tier.offers.length === 1) {
		checkin.checkin_for = marked_tier.offers[0];
		createCheckin(req, res, checkin, phone);
	}
	else {
		checkin.checkin_for = getApplicableOffer(count, program);
		createCheckin(req, res, checkin, phone);
	}
}

function getApplicableOffer (c, p) {
    
    count = Number(c);
    var rewards = [];
    var val = -1;
    var offer;

    var program = p;
    
    for(var i = 0; i < program.tiers.length; i++) {
        for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
            for(var j = 0; j < program.tiers[i].offers.length; j++) {
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                    if((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                        var obj = {};
                        obj.lim = lim;
                        obj.offer = program.tiers[i].offers[j];
                        rewards.push(obj);
                    }
                }
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
                    
                    if(lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                        var obj = {};
                        obj.lim = lim;
                        obj.offer = program.tiers[i].offers[j];
                        rewards.push(obj);
                    }
                }
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                    if(lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                        var obj = {};
                        obj.lim = lim;
                        obj.offer = program.tiers[i].offers[j];
                        rewards.push(obj);
                    }
                }
            }
        }
    }
	
	rewards = _.sortBy(rewards, function (patient) {
		return patient.lim;;
	});

	if(Number(rewards[0].lim) >= count) {
    	var j = 0;
    	offer = rewards[0].offer;
    	while((rewards[j++].lim === rewards[0].lim)) {
    		if(rewards[j].offer.user_eligibility.criteria.condition === 'on only') {
    			offer = rewards[j].offer;
    		}
    	}
    	return offer;
    }
    for (var i = 1; i < rewards.length; i++) {
        if(Number(rewards[i].lim) === count) {
        	
            offer = rewards[i+1].offer;
            var j = i+1;
        	while((rewards[j++].lim === rewards[i].lim)) {
        		if(rewards[j].offer.user_eligibility.criteria.condition === 'on only') {
        			offer = rewards[j].offer;
        		}
        	}
        }
        else if(Number(rewards[i-1].lim) < count && Number(rewards[i].lim) > count) {
      
            offer = rewards[i].offer;
            var j = i;
        	while((rewards[j++].lim === rewards[i].lim)) {
        		if(rewards[j].offer.user_eligibility.criteria.condition === 'on only') {
        			offer = rewards[j].offer;
        		}
        	}
        }
    };

    return offer;
};

function createCheckin(req, res, chk, phone) {

	var offer;
	var to_go_checkins = 0;
	if(chk.checkin_for) {
		offer = chk.checkin_for;
	}
	else {
		offer = null;
	}
	var checkin = new Checkin(chk);
	checkin.save(function (err, checkin) {
		if(err) {
			var push_message = 'Sorry, there was an error saving your check-in. Please try again with the same code.';
			responder(phone, push_message);
		}
		else {
			var push_message = 'Check-in successful. You are '+ to_go_checkins +' check-ins away from your next reward.';
			
			if(chk.checkin_program) {
				getOutlet(checkin.outlet, chk.checkin_program, phone);
			}
			else {
				responder(phone, push_message);
			}
			var sms_flag = true; // Use in voucher gen
			VoucherGenCtrl.readProgramAndPopulateTiers(checkin.outlet, phone, sms_flag);
			if(global_qr && global_qr.code) {
				updateQrUsedDetails(global_qr);
			}
		}
	});
}

function getOutlet(outlet_id, program, phone) {

	Outlet.findOne({_id: outlet_id}, function (err, outlet) {

		if(err || outlet === null) {
			var to_go_checkins = getNext(count, program);
			var push_message = 'Check-in successful. You are '+ to_go_checkins +' check-ins away from your next reward.';
			responder(phone, push_message);
		}
		else {
			getCheckinCount(program, phone, outlet);
		}
	});
}

function getCheckinCount(program, phone, outlet) {

	var program_id = '';
	if(program && program._id) {
		program_id = program._id;
	}
	
	Checkin.count({phone: phone, checkin_program: program._id}, function (err, count) {
		if(err) {
			count = 0;
		}
		var to_go_checkins = getNext(count, program);
		console.log(global_new_user);
		if(global_new_user) {
			var push_message = 'Welcome to the '+outlet.basics.name+' loyalty program on Twyst. You have been checked-in successfully, and are '+to_go_checkins+' check-ins away from your next reward at '+outlet.basics.name+'. Click http://twyst.in/download/%23/'+phone+' to get Twyst for Android.';
			responder(phone, push_message);
		}
		else {
			var push_message = 'Check-in successful. You are '+to_go_checkins+' check-ins away from your next reward at '+outlet.basics.name+'.';
			responder(phone, push_message);
		}
	});
}

function getNext (c, p) {
        
    count = Number(c);
    var rewards = [];
    var val = -1;

    var program = p;
    
    for(var i = 0; i < program.tiers.length; i++) {
        for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
            for(var j = 0; j < program.tiers[i].offers.length; j++) {
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                    if((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                        rewards.push(lim);
                    }
                }
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
                    
                    if(lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                        rewards.push(lim);
                    }
                }
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                    if(lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                        rewards.push(lim);
                    }
                }
            }
        }
    }
    
    rewards = _.uniq(rewards);
    rewards = _.sortBy(rewards, function (num) {
    	return num;
    });
    
    for (var i = 0; i < rewards.length; i++) {
        if(rewards[0] > count) {
            val = rewards[0] - count;
        }
        else if(rewards[i] === count) {
            val = rewards[i+1] - rewards[i];
        }
        else if(rewards[i-1] < count && rewards[i] > count) {
            val = rewards[i] - count;
        }
    };
    return val;
};

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