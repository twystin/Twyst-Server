var mongoose = require("mongoose"),
	async = require('async'),
	_ = require("underscore"),
	CommonUtils = require('../../common/utilities');
var Outlet = mongoose.model('Outlet')
	Program = mongoose.model('Program'),
	Checkin = mongoose.model('Checkin'),
	Voucher = mongoose.model('Voucher'),
	Follow = mongoose.model('Favourite'),
	Reward = mongoose.model('Reward');


module.exports.getRecco = function (req, res) {
	var lat = req.query.lat || 28.47178,
		lon = req.query.lon ||  77.1016,
		start = req.query.start || 1,
		end = req.query.end || 20,
		q = {'outlet_meta.status': 'active'};

	if(req.query.q) {
		q = getQuery(req.query.q);
	}

	getOutlets(q, function (outlets) {
		if(!outlets || !outlets.length) {
			res.send(200, {
				'status': 'success',
				'message': 'Got no reccos',
				'info': []
			});
		}
		else {
			getProgramsForOutlets(outlets, function (objects) {
				getIndependentUserData(function (results) {
					var unordered_set = computeReccoWeight(objects, results, lat, lon);
					if(req.user) {
						getUserHistory(req.user, function (err, history) {
							var relevant_set = addUserRelevance(unordered_set, history);
							var sorted_set = sortRecco(unordered_set);
							var result = {
								total: sorted_set.length,
								reccos: getNumberOfRecco(sorted_set, start, end)
							}
							getMatchedRewards(result.reccos, function (err, reccos) {
								if(!err) {
									result.reccos = reccos;
								}
								res.send(200, {
									'status': 'success',
									'message': 'Got recco data successfully',
									'info': result
								});
							})
						})
					}
					else {
						var sorted_set = sortRecco(unordered_set);
						var result = {
							total: sorted_set.length,
							reccos: getNumberOfRecco(sorted_set, start, end)
						}
						getMatchedRewards(result.reccos, function (err, reccos) {
							if(!err) {
								result.reccos = reccos;
							}
							res.send(200, {
								'status': 'success',
								'message': 'Got recco data successfully',
								'info': result
							});
						})
					}
				})
			});
		}
	})
}

function getQuery(query) {
	var query = query.split(/[ ,]+/);
	for(var i = 0; i < query.length; i++) {
		query[i] = new RegExp(query[i], "i");
	}
	var q = {
		'outlet_meta.status': 'active',
		$or:[{
				'basics.name': {
					$in: query
				}
			}, 
			{
				'contact.location.locality_1': {
					$in: query
				}
			},
			{ 
				'contact.location.locality_2': {
					$in: query
				}
			},
			{
				'contact.location.city': {
					$in: query
				}
			},
			{ 
				'attributes.tags': {
					$in: query
				}
			}
		]
	};
	return q;
}

function getMatchedRewards(cut_reccos, cb) {
	if(!cut_reccos || !cut_reccos.length) {
		cb(null, cut_reccos);
	}
	else {
		getRewards(cut_reccos, function (err, rewards) {
			if(err) {
				cb(err, cut_reccos);
			}
			else {
				cb(null, getReccosWithMatchedRewars(cut_reccos, rewards));
			}
		})
	}
}

function getReccosWithMatchedRewars(cut_reccos, rewards) {
	cut_reccos.forEach(function (c) {
		c.relevant_reward = null;
		if(c.program_summary) {
			c.relevant_reward = getMatchedReward(rewards, c.program_summary._id, c.checkin_count);
		}
	})
	return cut_reccos;
}

function getMatchedReward(rewards, program_id, count) {
	if(!program_id || !rewards) {
		return null;
	}
	else {
		for(var k = 0; k < rewards.length; k++) {
			var o = rewards[k];
			if(o.program.equals(program_id)) {
				if(!count) {
					return o.rewards[0];
				}
				else {					
					for (var i = 0; i < o.rewards.length; i++) {
				        if(o.rewards[i].count > count) {
					        return o.rewards[i];
					    }
				    };
				}
			}
		}
	}
	return null;
}

function getRewards(cut_reccos, cb) {
	Reward.find({
		program: {
			$in: getProgramIds(cut_reccos)
		}
	}, function (err, rewards) {
		cb(err, rewards);
	})
}

function getProgramIds(objects) {
	var ids = [];
	objects.forEach(function (o) {
		if(o.program_summary && o.program_summary._id) {
			ids.push(o.program_summary._id);
		}
	})
	return ids;
}

function addUserRelevance(unordered_set, history) {
	unordered_set.forEach(function (s) {
		var checkin_data = getCheckinRelevance(history.my_checkins, s.outlet_summary, s.program_summary);
		s.checkin_relevance = checkin_data.checkin_on_outlet * 5;
		s.checkin_count = checkin_data.checkin_in_program;
		s.follow_relevance = 20 * getFollowRelevance(history.my_follows, s.outlet_summary);
		s.active_rewards = getActiveVouchersHere(history.my_rewards, s.program_summary);
		s.reward_relevance = 5 * s.active_rewards.length;
		s.total += (s.checkin_relevance + s.follow_relevance + s.reward_relevance);
		s.is_following = s.follow_relevance ? true : false;
	})
	return unordered_set;
}

function getCheckinRelevance (checkins, outlet, program) {
	if(!outlet || !checkins.length) {
		return 0;
	}
	var checkin_on_outlet = 0,
		checkin_in_program = 0;
	for(var i = 0; i < checkins.length; i++) {
		if(checkins[i]._id 
			&& checkins[i]._id.outlet
			&& checkins[i]._id.outlet.equals(outlet._id)) {
			checkin_on_outlet += checkins[i].count;
		}
		if(program 
			&& checkins[i]._id 
			&& checkins[i]._id.program
			&& checkins[i]._id.program.equals(program._id)) {
			checkin_in_program += checkins[i].count;
		}
	}
	return {
		checkin_on_outlet: checkin_on_outlet, 
		checkin_in_program: checkin_in_program
	};
}

function getActiveVouchersHere (rewards, program) {
	var active_vouchers = [];
	if(!program || !rewards || !rewards.length) {
		return active_vouchers;
	}
	for(var i = 0; i < rewards.length; i++) {
		if(rewards[i].issue_details 
			&& rewards[i].issue_details.program
			&& rewards[i].issue_details.program.equals(program._id)) {
			active_vouchers.push(rewards[i]);
		}
	}
	return active_vouchers;
}

function getFollowRelevance (follows, outlet) {
	if(!outlet || !follows || !follows.length) {
		return false;
	}
	for(var i = 0; i < follows.length; i++) {
		if(follows[i].outlets && follows[i].outlets.equals(outlet._id)) {
			return true;
		}
	}
	return false;
}

function getUserHistory(user, cb) {
	async.parallel({
	    my_checkins: function(callback) {
	    	getMyCheckins(user, callback);
	    },
	    my_follows: function(callback) {
	    	getMyFollows(user, callback);
	    },
	    my_rewards: function(callback) {
	    	getMyRewards(user, callback);
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getMyFollows(user, callback) {
	Follow.find({
		account: user._id
	})
	.select({
		'account': 1,
		'outlets': 1
	})
	.exec(function (err, results) {
		callback(null, results);
	});
}

function getMyRewards(user, callback) {
	var q = {
		'basics.status': 'active',
		'issue_details.issued_to': user._id,
		'basics.created_at': {
			$lt: new Date()
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
	};
	Voucher.find(q, function (err, results) {
		callback(null, results || []);
	});
}

function getMyCheckins(user, callback) {
	var q = {
		match: {
			$match: {
				'phone': user.phone,
				'checkin_type': {
					'$ne': 'BATCH'
				}
			}
		},
		group: {
			$group: {
    			_id: {
    				'outlet': '$outlet',
    				'program': '$checkin_program'
    			},
    			count: { $sum: 1 }
    		}
		}
	};
	Checkin.aggregate(q.match, q.group, function (err, results) {
		callback(null, results || []);
	});
}

function getNumberOfRecco(sorted_set, start, end) {
	sorted_set = sorted_set.slice(start - 1, end);
	sorted_set.forEach(function (s) {
		s.total = 10000 - s.total;
	});
	return sorted_set;
}

function sortRecco(unordered_set) {
	var sorted_set = _.sortBy(unordered_set, function (s){
		return -s.total;
	});
	return sorted_set;
}

function computeReccoWeight(object_set, checkin_data, lat, lon) {
	object_set.forEach(function (o) {
		o.total = 0;
		o.popularity = getCheckinCountFromData(
			checkin_data.checkin_on_outlets, 
			o.outlet_summary) * 100 / checkin_data.total_checkins;
		o.distance = calculateDistance(o.outlet_summary, lat, lon)
		o.total = o.popularity + (100 - o.distance);
	});
	return object_set;
}

function calculateDistance(outlet, lat, lon) {
	var outlet_loc = outlet.contact.location.coords;
	var current_loc = {latitude: lat, longitude: lon};
	return CommonUtils.calculateDistance(outlet_loc, current_loc);
}

function getCheckinCountFromData(checkin_counts, outlet) {
	if(!outlet || checkin_counts.length == 0) {
		return 0;
	}
	for(var i = 0; i < checkin_counts.length; i++) {
		if(checkin_counts[i]._id && checkin_counts[i]._id.equals(outlet._id)) {
			return checkin_counts[i].count;
		}
	}
	return 0;
}

function getIndependentUserData(cb) {
	async.parallel({
	    checkin_on_outlets: function(callback) {
	    	countCheckinsForOutlets(callback);
	    },
	    total_checkins: function(callback) {
	    	countUniverseCheckin(callback);
	    }
	}, function(err, results) {
	    cb(results);
	});
}

function countUniverseCheckin(callback) {
	var date_before_15_days = new Date(new Date().getTime() - 1296000000);
	var today = new Date();
	Checkin.count({
		'checkin_date': {
			$gt: date_before_15_days,
			$lt: today
		},
		'checkin_type': {
			'$ne': 'BATCH'
		}}, function (err, count) {
			callback(null, count || 1);
	})
}

function countCheckinsForOutlets(callback) {
	var date_before_15_days = new Date(new Date().getTime() - 1296000000);
	var today = new Date();
	var q = {
		match: {
			$match: {
				'checkin_date': {
					$gt: date_before_15_days,
					$lt: today
				},
				'checkin_type': {
					'$ne': 'BATCH'
				}
			}
		},
		group: {
			$group: {
    			_id: '$outlet',
    			count: { $sum: 1 }
    		}
		}
	};
	Checkin.aggregate(q.match, q.group, function (err, results) {
		callback(null, results || []);
	});
}

function getProgramsForOutlets(outlets, callback) {
	var length = outlets.length;
	if(!length) {
		callback([]);
	}
	getPrograms(outlets, function (programs) {
		callback(buildDataObject(outlets, programs));
	})
}

function buildDataObject(outlets, programs) {
	var objects = [];
	outlets.forEach(function (o) {
		var obj = {};
		obj.outlet_summary = o;
		obj.closed_now = CommonUtils.isClosed(obj.outlet_summary.business_hours);
		obj.opensAt = null;
		if(obj.closed_now) {
			obj.opensAt = CommonUtils.opensAt(obj.outlet_summary.business_hours);
		}
		obj.program_summary = getMatchedProgram(programs, o._id);
		objects.push(obj); 
	});
	return objects;
}

function getMatchedProgram(programs, outlet_id) {
	if(!programs.length) return null;
	for(var i = 0; i < programs.length; i++) {
		if(programs[i].outlets && programs[i].outlets.length > 0) {
			for(var j = 0; j < programs[i].outlets.length; j++) {
				if(outlet_id.equals(programs[i].outlets[j])) {
					return programs[i];
				}
			}
		}
	}
	return null;
}

function getPrograms(outlets, callback) {
	Program.find({
		'status': 'active',
		'outlets': {
			$in: outlets.map(function (obj){
				return obj._id;
			})
		}
	}, function (err, programs) {
		callback(programs)
	})
}

function getOutlets (q, callback) {
	Outlet.find(q).
	select({
		'basics.name':1, 
		'contact.location': 1,
		'basics.is_a': 1,
		'basics.icon': 1,
		'contact.phones': 1,
		'publicUrl': 1,
		'business_hours': 1,
		'shortUrl': 1
	}).exec(function (err, outlets) {
		callback(outlets || []);
	})
}