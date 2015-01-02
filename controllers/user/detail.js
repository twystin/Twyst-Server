var mongoose = require("mongoose");
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var Reward = mongoose.model('Reward'),
	Follow = mongoose.model('Favourite');
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
								result.is_following = data.is_following;
								result.active_rewards = data.active_rewards;
								result.checkin_count = data.checkin_count;
								result.checkins_to_next_reward = checkinsToReward(reward, data.checkin_count);
								result.relevant_reward = getActiveReward(reward, data.checkin_count);
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

function getActiveReward(reward, count) {
	if(!reward || !reward.rewards.length) {
		return null;
	}
	else {
		for (var i = 0; i < reward.rewards.length; i++) {
	        if(reward.rewards[i].count > count) {
		        return reward.rewards[i];
		    }
	    };
	}
	return null;
}

function getOtherInfo(user, result, cb) {
	async.parallel({
	    active_rewards: function(callback) {
	    	getActiveRewards(user, result, function (has_active) {
	    		callback(null, has_active);
	    	});
	    },
	    checkin_count: function(callback) {
	    	getCheckinCount(user, result, function (err, count) {
	    		count = count || 0;
	    		callback(null, count);
	    	})
	    },
	    is_following: function(callback) {
	    	isFollowing(user, result, function (err, follow) {
	    		var value = follow ? true : false;
	    		callback(null, value);
	    	})
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function isFollowing(user, result, cb) {
	if(!user || !user.phone || !result.outlet_details) {
		cb(null, false);
	}
	else {
		Follow.findOne({
			'outlets': result.outlet_details._id,
			'account': user._id
		}, function (err, follow) {
			cb(err, follow);
		})
	}
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

function getActiveRewards(user, result, cb) {
	if(!user || !result.outlet_details) {
		cb([]);
	}
	else {
		Voucher.find({
			'basics.status': 'active',
			'issue_details.issued_to': user._id,
			'issue_details.issued_at': result.outlet_details._id,
			'basics.created_at': {
				$lt: new Date(Date.now() - 10800000)
			},
			$and: [
				{
					'validity.start_date': {
						$lt: new Date()
					},
				},
				{
					'validity.end_date': {
						$gt: new Date()
					}
				}		
			]
		}, function (err, vouchers) {
			cb(vouchers || []);
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
		cb(null, null);
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
	    },
	    total_checkin: function(callback) {
	    	getTotalCheckinCount(outlet_id, function (err, count) {
	    		if(err) {
	    			console.log("Error in checkin count get at async");
	    			// No need to handle this.
	    		}
	    		callback(null, count);
	    	})
	    },
	    total_follow: function(callback) {
	    	getTotalFollowCount(outlet_id, function (err, count) {
	    		if(err) {
	    			console.log("Error in follow count get at async");
	    			// No need to handle this.
	    		}
	    		callback(null, count);
	    	})
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getTotalCheckinCount(outlet_id, cb) {
	Checkin.count({
		outlet: outlet_id,
		checkin_type: {
			$ne: 'BATCH'
		}
	}, function (err, count) {
		cb(err, count);
	})
}

function getTotalFollowCount(outlet_id, cb) {
	Follow.count({
		outlets: outlet_id
	}, function (err, count) {
		cb(err, count);
	})
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
		cb(err, program);
	})
}