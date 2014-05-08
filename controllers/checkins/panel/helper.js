'use strict';
var _ = require('underscore');
var mongoose = require('mongoose');
var async = require('async');
var Checkin = mongoose.model('Checkin');
var Qr = mongoose.model('Qr');
var Program = mongoose.model('Program');
var Outlet = mongoose.model('Outlet');

var Tier = mongoose.model('Tier');
var Account = mongoose.model('Account');
var SmsSentLog = mongoose.model('SmsSentLog');

module.exports.getCheckinHistory = function(query, cb) {
	async.parallel({
	    last: function(callback) {
	    	getLastCheckin(query, callback);
	    },
	    count: function(callback) {
	    	getCheckinCount(query, callback);
	    }
	}, function(err, results) {
	    cb(results);
	});

	function getLastCheckin(query, callback) {
		Checkin.findOne({
				phone: query.phone, 
				checkin_program: query.program._id
			}, {}, { sort: { 'created_date' : -1 } }, function(err, checkin) {

				callback(null, checkin);
		});
	}

	function getCheckinCount(query, callback) {
		Checkin.count({
				phone: query.phone, 
				checkin_program: query.program._id
			}, function(err, count) {
				if(err) {
					count = 0;
				}
				callback(null, count);
		});
	}
}

module.exports.getActiveProgram = function(query, cb) { 
	Program.findOne({
			outlets: query.outlet,
			'status': 'active'
		}, function(err, program) {

			populateProgram(program, cb);
	});

	function populateProgram (program, cb) {
		var tiers = [];
		var count = program.tiers.length;

		program.tiers.forEach(function (id) {
			Tier.findOne({_id: id}).populate('offers').exec(function (err, tier) {
				var t = {};
				t = tier;
				count--;
				tiers.push(t);
				if(count === 0) {
					program = program.toObject();
					program.tiers = tiers;
					cb(program);
				}
			})
		});
	}
}

module.exports.getApplicableOffer = function (p, c) {
	var count = Number(c);
    var rewards = [];
    var val = -1;

    var program = p;
    var obj = {};
    
    for(var i = 0; i < program.tiers.length; i++) {
        for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
            for(var j = 0; j < program.tiers[i].offers.length; j++) {
                obj = {};
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                    if((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                        obj.lim = lim;
                        obj.tier = program.tiers[i];
                        obj.offer = program.tiers[i].offers[j];
                        rewards.push(obj);
                    }
                }
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
                    
                    if(lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                        obj.lim = lim;
                        obj.tier = program.tiers[i];
                        obj.offer = program.tiers[i].offers[j];
                        rewards.push(obj);
                    }
                }
                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                    if(lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                        obj.lim = lim;
                        obj.tier = program.tiers[i];
                        obj.offer = program.tiers[i].offers[j];
                        rewards.push(obj);
                    }
                }
            }
        }
    }
    
    rewards = _.uniq(rewards, function (obj) {
    	return obj.lim;
    });

    rewards = _.sortBy(rewards, function (obj) {
    	return obj.lim;
    });

    if(rewards[0].lim > count) {
        obj = rewards[0];
    }
    
    for (var i = 1; i < rewards.length; i++) {
        if(rewards[i].lim === count) {
            obj = rewards[i+1];
        }
        else if(rewards[i-1].lim <= count && rewards[i].lim > count) {
            obj = rewards[i];
        }
    };

    return obj;
}

module.exports.isRewardTime = function (tier, count) {
	var in_tier_checkin_count = count - tier.basics.start_value + 1;
	var total_checkin_count = count - 0;
	var reward = null;
	if(total_checkin_count === 0) {
		total_checkin_count = count + 1;
	}

	tier.offers.forEach(function (offer) {
		if(offer.user_eligibility) {
			if(offer.user_eligibility.criteria) {
				if(offer.user_eligibility.criteria.condition === 'on only') {
					if(Number(offer.user_eligibility.criteria.value) === total_checkin_count) {
						reward = offer;
					}
				}
				if(offer.user_eligibility.criteria.condition === 'after') {
					if(Number(offer.user_eligibility.criteria.value) <= total_checkin_count) {
						reward = offer;
					}
				}
				if(offer.user_eligibility.criteria.condition === 'on every') {
					if(in_tier_checkin_count % Number(offer.user_eligibility.criteria.value) === 0) {
						reward = offer;
					}
				}
			}
		}		
	});
	return reward;
}

module.exports.isUserRegistered = function (query, cb) {

	Account.findOne({phone: query.phone}, function (err, user) {
		if(err) {
			cb(null);
		}
		else {
			if(user) {
				cb(user);
			}
			else {
				registerUser();
			}
		}
	});

	function registerUser() {
		Account.register(
			new Account({ 
				username : query.phone, 
				phone: query.phone, 
				role: 6
			}), query.phone, function(err, account) {

	        if (err) {
	        	console.log(err);
	            cb(false);
	        } else {
	            cb(true);
	        }
	    });
	}
}