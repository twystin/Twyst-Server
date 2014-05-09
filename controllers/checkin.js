var mongoose = require('mongoose');
var Checkin = mongoose.model('Checkin');
var Qr = mongoose.model('Qr');
var VoucherGenCtrl = require('../controllers/voucher-gen');
var Program = mongoose.model('Program');
var Outlet = mongoose.model('Outlet');

var Tier = mongoose.model('Tier');
var Account = mongoose.model('Account');
var SmsSentLog = mongoose.model('SmsSentLog');

var _ = require('underscore');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');
 
var global_qr = null;
var global_panel = false;
var global_new_user = false;

module.exports.panelCheckin = function(req, res) {
	var phone = req.body.phone;
	var outlet = req.body.outlet;
	var checkin_type = 'PANEL';
	var checkin_code = 'PANEL';
	var checkin_location = req.body.location;

	var qr = null;

	isUserRegistered ();

	global_panel = true;
	global_new_user = false;

	function isUserRegistered () {
		
		Account.findOne({phone: phone}, function (err, user) {
			if(err || user === null) {
				createNewUser();
				global_new_user = true;
			}
			else {
				detectSixHoursCap(qr, req, res, outlet, phone, checkin_type, checkin_code, checkin_location);
			}
		});
	}

	function createNewUser() {
		
		Account.register(new Account({ username : phone, phone: phone, role: 6}), phone, function(err, account) {
	        if (err) {
	            res.send(400, {
	            	'status': 'error',
	            	'message': 'Error registering checkin. Please try again.',
	            	'info': JSON.stringify(err)
	            });
	        } else {
	            detectSixHoursCap(qr, req, res, outlet, phone, checkin_type, checkin_code, checkin_location);
	        }
	    });
	}
}

module.exports.qrCheckin = function(req, res) {

	global_qr = null;

	var created_checkin = {};
	Qr.findOne({code: req.body.code}).populate('outlet_id').exec(function (err, qr) {
		if(err) {
			res.send(400, {	'status': 'error',
						'message': 'Sorry, check-in unsuccessful – this code is invalid. Please try again with a valid code.',
						'info': JSON.stringify(err)
			});
		}
		else {
			if(qr !== null) {
				global_qr = qr;
				validateQrCode(qr, req, res);
			}
			else {
				res.send(200, {	'status': 'error',
									'message': 'Sorry, check-in unsuccessful – this code is invalid. Please try again with a valid code.',
									'info': ''
				});
			}
		}
	})
};

function validateQrCode (qr, req, res) {
	
	if(qr.times_used <= qr.max_use_limit) {
		if(qr.validity.start && qr.validity.end) {
			console.log(qr.validity.start);
			console.log(qr.validity.end);
			console.log(new Date(Date.now()));
			if(qr.validity.start < Date.now() && qr.validity.end > Date.now()) {
				
				checkValidCheckin(qr, req, res);
			}
			else {
				res.send(200, {	'status': 'error',
							'message': 'Sorry, check-in unsuccessful – this code has expired. Please try again with a valid code.',
							'info': ''
				});
			}
		}
		else {
			res.send(200, {	'status': 'error',
						'message': 'Sorry, check-in unsuccessful – this code has expired. Please try again with a valid code.',
						'info': ''
			});
		}
	}
	else {
		res.send(200, {	'status': 'error',
						'message': 'Sorry, check-in unsuccessful – this code has expired. Please try again with a valid code.',
						'info': ''
		});
	}
}

function checkValidCheckin(qr, req, res) {

	var checkin_location;

	if(qr.type === 'single') {
		checkin_location = 'HOME_DELIVERY';
		detect();
	}
	else {
		checkin_location = 'DINE_IN';
		onValidRequest(qr, req, res, checkin_location);
		//checkUserLocation(qr, req, res);
	}

	function detect() {
		Checkin.findOne({checkin_code: qr.code, phone: req.user.phone}, function(err, checkin) {
		
			if(err) {
				res.send(200, {
					'status': 'error',
					'message': 'Sorry, there was an error saving your check-in. Please try again with the same code.',
					'info': ''
				});
			}
			if(checkin === null) {
				onValidRequest(qr, req, res, checkin_location);
			}
			else {
				res.send(200, {
					'status': 'error',
					'message': 'Sorry, you’ve already used this code to check-in. Please try again with a valid code.',
					'info': ''
				});
			}
		});
	}
}

function updateQrUsedDetails(qr) {
	if(qr !== null) {
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
}

function checkUserLocation (qr, req, res) {

	if(req.user.home && req.user.home.longitude && req.user.home.latitude) {
		getOutletLocation();
	}
	else {
		res.send(200, {	'status': 'error',
						'message': 'Home location not set for user',
						'info': ''
		});
	}

	function getOutletLocation () {
		var outlet = qr.outlet_id;

		if(outlet.contact
			&& outlet.contact.location
			&& outlet.contact.location.coords
			&& outlet.contact.location.coords.longitude
			&& outlet.contact.location.coords.latitude) {

			var distance = calculateDistance(req.user, outlet) * 1000;
			console.log("Distance = "+distance);

			if(distance > 200) {
				res.send(200, {	'status': 'error',
								'message': 'Checkin error! Please contact your server to checkin.',
								'info': ''
				});
			}
			else {
				onValidRequest(qr, req, res);
			}
		}
		else {
			res.send(200, {	'status': 'error',
							'message': 'Location not set for outlet',
							'info': ''
			});
		}
	}

	function calculateDistance(user, outlet) {

		var p1 = {latitude: outlet.contact.location.coords.latitude, longitude: outlet.contact.location.coords.longitude};
        var p2 = {latitude: user.home.latitude, longitude: user.home.longitude};

		var R = 6371; // km
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function() {
                return this * Math.PI / 180;
            };
        }

        if (!p1 || !p2) {
            return 100; 
            //return null;
        }

        var dLat = (p2.latitude-p1.latitude).toRad();
        var dLon = (p2.longitude-p1.longitude).toRad();
        
        var lat1 = p1.latitude.toRad();
        var lat2 = p2.latitude.toRad();

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        console.log(d);
        if (d > 100) {
            return 100;
        }
        return d.toFixed(1);
	}
}

function onValidRequest(qr, req, res, checkin_location) {
	var created_checkin = {};

	if(qr.outlet_id) {
		created_checkin.outlet = qr.outlet_id;
		if(req.user) {
			if(req.user.phone) {
				created_checkin.phone = req.user.phone;
				created_checkin.checkin_type = 'QR';
				created_checkin.checkin_code = qr.code;

				detectSixHoursCap(qr, req, res, created_checkin.outlet, 
					created_checkin.phone, 
					created_checkin.checkin_type,
					created_checkin.checkin_code, checkin_location);
			}
			else {
				res.send(200, {	'status': 'error',
								'message': 'Phone number of user not available',
								'info': ''
				});
			}
		}
		else {
			res.send(200, {	'status': 'error',
							'message': 'User not logged in',
							'info': ''
			});
		}
	}
	else {
		res.send(200, {	'status': 'error',
						'message': 'Sorry, check-in unsuccessful – this code is invalid. Please try again with a valid code.',
						'info': ''
		});
	}
}

function detectSixHoursCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location) {
	
	Checkin.findOne({phone: phone, outlet: outlet_id}, {}, { sort: { 'created_date' : -1 } }, function(err, checkin) {
		if(err) {
			detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location);
		}
		if(checkin === null) {
			detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location);
		}
		else {
			var diff = Date.now() - checkin.created_date;
			if(diff > 21600000) {
				detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location);
			}
			else {
				res.send(200, {	'status': 'error',
								'message': 'We’ve already registered your check-in here. Please check-in again on your next visit / order.',
								'info': JSON.stringify(null)
				});
			}
		}
	});
}

function detectThirtyMinutesCap(qr, req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location) {
	
	Checkin.findOne({phone: phone}, {}, { sort: { 'created_date' : -1 } }, function(err, checkin) {
		if(err) {
			create(req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location);
		}
		if(checkin === null) {
			create(req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location);			
		}
		else {
			var diff = Date.now() - checkin.created_date;
			if(diff > 1800000) {
				create(req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location);				
			}
			else {
				res.send(200, {	'status': 'error',
								'message': 'You’ve checked-in recently somewhere else. Please try checking-in here after some time.',
								'info': JSON.stringify(null)
				});
			}
		}
	});
}

function create (req, res, outlet_id, phone, checkin_type, checkin_code, checkin_location) {

	Program.findOne({outlets: outlet_id, status: 'active'}).populate('tiers').exec(function (err, program) {
		if(program === null || err) {
			var checkin = {};
			checkin.outlet = outlet_id;
			checkin.phone = phone;
			checkin.checkin_code = checkin_code;
			checkin.checkin_type = checkin_type;
			checkin.location = checkin_location;
			createCheckin(req, res, checkin);
		}
		else {
			populateOffers(req, res, program, outlet_id, phone, checkin_type, checkin_code, checkin_location);
		}
	})
}

function populateOffers (req, res, program, outlet_id, phone, checkin_type, checkin_code, checkin_location) {
	var tiers = [];
	var tier_count = program.tiers.length;
	program.tiers.forEach(function (tier) {
		Tier.findOne({_id: tier._id}).populate('offers').exec(function (err, tier) {
			if(err) {
				
				tier_count--;
				if (tier_count === 0) {
					program.tiers = tiers;
					countCheckinforUser(req, res, program, outlet_id, phone, checkin_type, checkin_code, checkin_location);
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
					countCheckinforUser(req, res, program, outlet_id, phone, checkin_type, checkin_code, checkin_location);
				}
			}
		})
	})
}

function countCheckinforUser(req, res, program, outlet_id, phone, checkin_type, checkin_code, checkin_location) {
	Checkin.count({phone: phone, checkin_program: program._id}, function (err, count) {
		if(err) {
			var checkin = {};
			checkin.outlet = outlet_id;
			checkin.phone = phone;
			checkin.checkin_program = program;
			checkin.checkin_code = checkin_code;
			checkin.checkin_type = checkin_type;
			checkin.location = checkin_location;
			createCheckin(req, res, checkin);
		}
		else {
			decideTier(req, res, program, outlet_id, phone, count, checkin_type, checkin_code, checkin_location);
		}
	});
}

function decideTier(req, res, program, outlet_id, phone, count, checkin_type, checkin_code, checkin_location) {
	var marked_tier = null;
	var offer_count;
	var tier_count = program.tiers.length;
	// TODO FIX THIS
	if(count === 0) {
		count += 1;
	}
	program.tiers.forEach(function (tier) {
		if((tier.basics.start_value <= count) && (tier.basics.end_value >= count)) {
			marked_tier = tier;
			offer_count = marked_tier.offers.length;
		}
	});
	if(marked_tier) { 
		if(offer_count > 0) {
			decideOffer(req, res, program, marked_tier, outlet_id, phone, count, checkin_type, checkin_code, checkin_location);
		}
		else {
			var checkin = {};
			checkin.outlet = outlet_id;
			checkin.phone = phone;
			checkin.checkin_program = program;
			checkin.checkin_tier = marked_tier;
			checkin.checkin_code = checkin_code;
			checkin.checkin_type = checkin_type;
			checkin.location = checkin_location;
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
		checkin.location = checkin_location;
		createCheckin(req, res, checkin);
	}
}

function decideOffer(req, res, program, marked_tier, outlet_id, phone, count, checkin_type, checkin_code, checkin_location) {

	var checkin = {};
	checkin.outlet = outlet_id;
	checkin.phone = phone;
	checkin.checkin_program = program;
	checkin.checkin_tier = marked_tier;
	checkin.checkin_code = checkin_code;
	checkin.checkin_type = checkin_type;
	checkin.location = checkin_location;
	
	if(marked_tier.offers.length === 1) {
		checkin.checkin_for = marked_tier.offers[0];
		createCheckin(req, res, checkin);
	}
	else {
		checkin.checkin_for = getApplicableOffer(count, program);
		createCheckin(req, res, checkin);
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

function createCheckin(req, res, checkin) {
	
	var offer, program;
	if(checkin.checkin_for) {
		offer = checkin.checkin_for;
	}
	else {
		offer = null;
	}

    if(checkin.checkin_program) {
        program = checkin.checkin_program;
    }
    else {
        program = null;
    }
    
	var checkin = new Checkin(checkin);
	checkin.save(function (err, checkin) {
		if(err) {
			res.send(400, {	'status': 'error',
									'message': 'Sorry, there was an error saving your check-in. Please try again with the same code.',
									'info': JSON.stringify(err)
			});
		}
		else {
			var sms_flag = false;
			if(global_panel) {
				getOutlet(checkin.outlet, program, checkin.phone);
				sms_flag = true;
				global_panel = false;
			}
			responder(checkin, offer, program, res);
			
			VoucherGenCtrl.readProgramAndPopulateTiers(checkin.outlet, checkin.phone, sms_flag);
			// Checking if it is a QR checkin. Yes, then update QR
			if(global_qr && global_qr.code) {
				updateQrUsedDetails(global_qr);
				global_qr = null;
			}
		}
	});
}

function getOutlet(outlet_id, program, phone) {

	Outlet.findOne({_id: outlet_id}, function (err, outlet) {

		if(err || outlet === null) {
			var to_go_checkins = getNext(count, program);
			var push_message = 'Check-in successful. You are '+ to_go_checkins +' check-ins away from your next reward.';
			smsResponder(phone, push_message);
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

	Checkin.count({phone: phone, checkin_program: program_id}, function (err, count) {
		if(err) {
			count = 0;
		}
		var to_go_checkins = getNext(count, program);
		console.log(global_new_user);
		if(global_new_user) {
			var push_message = 'Welcome to the '+outlet.basics.name+' loyalty program on Twyst. You have been checked-in successfully, and are '+to_go_checkins+' check-ins away from your next reward at '+outlet.basics.name+'. Click http://twyst.in/download/%23/'+phone+' to get Twyst for Android.';
			smsResponder(phone, push_message);
		}
		else {
			var push_message = 'Check-in successful. You are '+to_go_checkins+' check-ins away from your next reward at '+outlet.basics.name+'.';
			smsResponder(phone, push_message);
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

function responder(checkin, offer, program, res) {
	var checkin_object = {};
	Outlet.findOne({_id: checkin.outlet}, function (err, outlet) {
		if(err) {
			res.send(200, {'status': 'success',
									'message': 'Checkin successful. Error getting Outlet',
									'info': JSON.stringify(err)
			});
		}
		else {
			checkin_object.outlet = outlet;
			checkin_object.offer = offer;
            checkin_object.program = program;
			res.send(200, {'status': 'success',
									'message': 'Checkin successful.',
									'info': JSON.stringify(checkin_object)
			});
		}
	});
}

function smsResponder(phone, push_message) {
	push_message = push_message.replace(/(\n)+/g, '');
	
	saveSentSms(phone, push_message);

	var message = push_message.replace('&','n');
	console.log(message);
	var send_sms_url = sms_push_url + phone + "&from=TWYSTR&udh=0&text=" + message;
	var test_url = 'http://staging.twyst.in/api/v2/sms/status';
	http.post(send_sms_url, function(res){
		console.log(res.statusCode);
		res.on('data', function(chunk) {
            // append chunk to your data
            body += chunk;
        });

        res.on('end', function() {
            console.log(body);
        });

        res.on('error', function(e) {
            console.log("Error message: " + e.message)
        });
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

module.exports.query = function(req,res) {
	Checkin.find({}, function(err,checkins) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting list of checkins',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {'status': 'success',
						'message': 'Got all checkins',
						'info': JSON.stringify(checkins)
			});
		}
	}) 
};

module.exports.read = function(req,res) {
	Checkin.find({slug: req.params.checkin_id}, function(err,checkin) {
		if (err) {
			res.send(400, {'status': 'error',
						'message': 'Error getting checkin id ' + req.params.checkin_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {'status': 'success',
						'message': 'Got checkin ' + req.params.checkin_id,
						'info': JSON.stringify(checkin)
			});
		}
	}) 
};


module.exports.update = function(req,res) {
	var updated_checkin = {};
	updated_checkin = _.extend(updated_checkin, req.body);
	Checkin.findOneAndUpdate(
							{slug:req.params.checkin_id}, 
							{$set: updated_checkin }, 
							{upsert:true},
							function(err,checkin) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating checkin ' + req.params.checkin_id,
												'info': JSON.stringify(err)
									});
								} else {
									res.send(200, {'status': 'success',
												'message': 'Successfully updated checkin',
												'info': JSON.stringify(checkin)
									});
								}
							});
};

module.exports.delete = function(req,res) {
    Checkin.findOneAndRemove({slug:req.params.checkin_id}, function(err){
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error deleting checkin ' + req.params.checkin_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {'status': 'success',
						'message': 'Successfully deleted checkin',
						'info': ''
			});
		}
	});
};