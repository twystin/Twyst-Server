var mongoose = require("mongoose");
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var Reward = mongoose.model('Reward');
var async = require('async');
var CommonUtils = require('../../common/utilities');

module.exports.getDetails = function (req, res) {
	var lat = req.query.lat,
		lon = req.query.lon,
		outlet_id = req.query.outlet_id;

	if(!outlet_id) {
		res.send(400, {
			'status': 'error',
			'message': 'Error getting nearby data.',
			'info': null
		});
	}
	else {
		getInfo(outlet_id, function (err, result) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting outlet.',
					'info': null
				});
			}
			else {
				if(!result.outlet_details) {
					res.send(400, {
						'status': 'error',
						'message': 'Outlet not found.',
						'info': null
					});
				}
				else {
					getRewardTree(result, function (err, reward) {
						if(err) {
							res.send(200, {
								'status': 'success',
								'message': 'Got details successfully',
								'info': result
							});
						}
						else {
							result.reward_tree = reward;
							if(lat && lon) {
								result.distance = calculateDistance(result.outlet_details, lat, lon);
							}
							getOtherInfo(req.user, result, function (err, data) {
								result.active_reward = data.active_reward;
								result.checkin_count = data.checkin_count;
								result.checkins_to_next_reward = checkinsToReward(reward, data.checkin_count);
								res.send(200, {
									'status': 'success',
									'message': 'Got details successfully',
									'info': result
								});
							})
						}
					})
				}
			}
		});
	}
}

function checkinsToReward(reward, count) {
	if(!reward || !reward.rewards.length) {
		return 0;
	}
	else {
		for (var i = 0; i < reward.rewards.length; i++) {
	        if(reward.rewards[i].count > count) {
		        return reward.rewards[i].count - count;
		    }
	    };
	}
	return 0;
}

function getOtherInfo(user, result, cb) {
	async.parallel({
	    active_reward: function(callback) {
	    	hasActiveReward(user, result, function (has_active) {
	    		callback(null, has_active);
	    	});
	    },
	    checkin_count: function(callback) {
	    	getCheckinCount(user, result, function (err, count) {
	    		count = count || 0;
	    		callback(null, count);
	    	})
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getCheckinCount(user, result, cb) {
	if(!user || !user.phone || !result.programs_details) {
		cb(null, 0);
	}
	else {
		Checkin.count({
			'checkin_program': result.programs_details._id,
			'phone': user.phone
		}, function (err, count) {
			cb(err, count);
		})
	}
}

function hasActiveReward(user, result, cb) {
	if(!user || !result.programs_details) {
		cb(false);
	}
	else {
		Voucher.findOne({
			'issue_details.program': result.programs_details._id,
			'issue_details.issued_to': user._id
		}, function (err, voucher) {
			cb(voucher ? true :  false);
		})
	}
}

function calculateDistance(outlet, lat, lon) {
	var outlet_loc = outlet.contact.location.coords;
	var current_loc = {latitude: lat, longitude: lon};
	return CommonUtils.calculateDistance(outlet_loc, current_loc);
}

function getRewardTree(result, cb) {
	if(!result.programs_details) {
		cb(null, []);
	}
	else {
		getReward(result.programs_details, function (err, reward) {
			cb(err, reward);
		})
	}
}

function getReward(program, cb) {
	Reward.findOne({
		program: program._id
	}, function (err, reward) {
		cb(err, reward);
	})
}

function getInfo(outlet_id, cb) {
	async.parallel({
	    outlet_details: function(callback) {
	    	getOutlet(outlet_id, function (err, outlet) {
	    		if(err) {
	    			callback(err, null);
	    		}
	    		else {
	    			callback(null, outlet);
	    		}
	    	})
	    },
	    programs_details: function(callback) {
	    	getProgram(outlet_id, function (err, program) {
	    		if(err) {
	    			console.log("Error in program get at async");
	    			// No need to handle this.
	    		}
	    		callback(null, program);
	    	})
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getOutlet(outlet_id, cb) {
	Outlet.findOne({
		_id: outlet_id
	}, function (err, outlet) {
		cb(err, outlet);
	})
}

function getProgram(outlet_id, cb) {
	Program.findOne({
		outlets: outlet_id,
		status: 'active'
	}, function (err, program) {
		if(err || !program) {
			cb(err, program);
		}
		else {
			populateTiers(program, function (err, populated_program) {
				cb(err, populated_program);
			})
		}
	})
}

function populateTiers(program, cb) {
	Tier.find({
		_id: {
			$in: program.tiers
		}
	})
	.populate('offers')
	.exec(function (err, tiers) {
		if(err) {
			cb(err, program);
		}
		else {
			program = program.toObject();
			program.tiers = tiers;
			cb(null, program);
		}
	})
}