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
    	if(program.tiers[i]) {
    		for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
	            for(var j = 0; j < program.tiers[i].offers.length; j++) {
	                obj = {};
	                if(program.tiers[i].offers[j]) {
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

	if(!tier || tier.offers.length === 0) {
		return null;
	}

	for(var i = 0; i < tier.offers.length; i++) {
		if(tier.offers[i]) {
			if(tier.offers[i].user_eligibility) {
				if(tier.offers[i].user_eligibility.criteria) {
					if(tier.offers[i].user_eligibility.criteria.condition === 'on only') {
						if(Number(tier.offers[i].user_eligibility.criteria.value) === total_checkin_count) {
							reward = tier.offers[i];
							break;
						}
					}
					if(tier.offers[i].user_eligibility.criteria.condition === 'after') {
						if(Number(tier.offers[i].user_eligibility.criteria.value) <= total_checkin_count) {
							reward = tier.offers[i];
							break;
						}
					}
					if(tier.offers[i].user_eligibility.criteria.condition === 'on every') {
						if((in_tier_checkin_count + 1) % Number(tier.offers[i].user_eligibility.criteria.value) === 0) {
							reward = tier.offers[i];
							break;
						}
					}
				}
			}
		}
	}
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
	            cb(account);
	        } else {
	            cb(account);
	        }
	    });
	}
}

module.exports.getDOW = function(array) {
	if(array.length === 0) {
		return '';
	}
	for(var i = 0; i < array.length; i++ ) {
    	if(array[i] !== 'all days') {
            return 'on '+array.join(',');
        }
        if(array[i] === 'all days') {
            return 'on all days of the week';
        }
    };
}

module.exports.getTOD = function(array) {
	if(array.length === 0) {
		return '';
	}
	for(var i = 0; i < array.length; i++ ) {

        if(array[i] !== 'all day') {
            return 'at '+array.join(',');
        }
        if(array[i] === 'all day') {
            return 'all day long';
        }
    };
}

module.exports.getOutlet = function(id, cb) {
	Outlet.findOne({_id: id}, function(err, outlet) {
		cb(outlet);
	});
}

module.exports.getNext = function(c, p) {
        
    var count = Number(c) + 1;
    var rewards = [];
    var val = -1;

    var program = p;
    
    for(var i = 0; i < program.tiers.length; i++) {
        if(program.tiers[i]) {
        	for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
	            for(var j = 0; j < program.tiers[i].offers.length; j++) {
	                if(program.tiers[i].offers[j]) {
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
}