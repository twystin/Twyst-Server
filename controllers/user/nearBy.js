var mongoose = require("mongoose");
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var Reward = mongoose.model('Reward');
var async = require('async');
var CommonUtils = require('../../common/utilities');

module.exports.getNearby = function (req, res) {
	var lat = req.query.lat,
		lon = req.query.lon,
		distance = req.query.distance || 500;

	if(!lat || !lon) {
		res.send(400, {
			'status': 'error',
			'message': 'Error getting nearby data.',
			'info': null
		});
	}
	else {
		getInfo();
	}

	function getInfo() {
		getOutlets(lat, lon, distance, function (outlets) {
			if(!outlets.length) {
				res.send(200, {
					'status': 'success',
					'message': 'Got no outlets',
					'info': []
				});
			} 
			else {
				getProgramsForOutlets(outlets, function (objects) {
					getOtherInfos(req.user, 
						objects, 
						{
							latitude: lat, 
							longitude: lon
						}, function (results) {
							var result = {
								total: results.length,
								near: results
							}
							getMatchedRewards(result.near, function (err, near) {
								if(!err) {
									result.near = near;
								}
								res.send(200, {
									'status': 'success',
									'message': 'Got nearby data successfully',
									'info': result
								});
							})
					})
				});
			}
		})
	}
}

function getMatchedRewards(nearby, cb) {
	if(!nearby || !nearby.length) {
		cb(null, nearby);
	}
	getRewards(nearby, function (err, rewards) {
		if(err) {
			cb(err, nearby);
		}
		else {
			cb(null, getReccosWithMatchedRewars(nearby, rewards));
		}
	})
}

function getReccosWithMatchedRewars(nearby, rewards) {
	nearby.forEach(function (c) {
		c.relevant_reward = null;
		if(c.program_summary) {
			c.relevant_reward = getMatchedReward(rewards, c.program_summary._id, c.checkin_count);
		}
	})
	return nearby;
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

function getRewards(nearby, cb) {
	Reward.find({
		program: {
			$in: getProgramIds(nearby)
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

function getOtherInfos(user, objects, loc, cb) {
	var length = objects.length;
	if(!length) {
		cb([]);
	}
	getInfoForAuthUser(objects, user, function (data) {
		objects.forEach(function (o) {
			var outlet_loc = o.outlet_summary.contact.location.coords;
			o.distance = CommonUtils.calculateDistance(loc, outlet_loc);
			o.checkin_count = getCheckinCount(o.program_summary, data.checkin_counts);
			o.active_reward = hasActiveVoucher(o.program_summary, data.active_rewards)
		});
		cb(objects);
	})
}

function getCheckinCount(program, checkin_counts) {
	if(!program || checkin_counts.length === 0) {
		return 0;
	}
	for(var i = 0; i < checkin_counts.length; i++) {
		if(checkin_counts[i] && checkin_counts[i]._id.equals(program._id)) {
			return checkin_counts[i].count;
		}
	}
	return 0;
}

function hasActiveVoucher(program, active_rewards) {
	if(!program || !active_rewards.length) {
		return false;
	}
	for(var i = 0; i < active_rewards.length; i++) {
		if(active_rewards[i] && active_rewards[i]._id.equals(program._id)) {
			return true;
		}
	}
	return false;
}

function getInfoForAuthUser(objects, user, cb) {
	if(!user) {
		cb({checkin_counts: [], active_rewards: []});
	}
	else {
		async.parallel({
		    checkin_counts: function(callback) {
		    	var q = {
		    		match: {
		    			$match: { 
				    		checkin_program: {$in:
				    			objects.map(function (obj) {
				    				return mongoose.Types.ObjectId(obj.program_summary ? obj.program_summary._id : null);
				    			})
				    		},
				    		phone: user.phone
			    		}
		    		},
		    		group: {
		    			$group: {
			    			_id: '$checkin_program',
			    			count: { $sum: 1 }
			    		}
		    		}
		    	};
		    	getCheckinCountAggregate(q, callback);
		    },
		    active_rewards: function(callback) {
		    	var q = {
		    		match: {
		    			$match: { 
				    		'issue_details.program': {$in: 
				    			objects.map(function (obj) {
				    				return mongoose.Types.ObjectId(obj.program_summary ? obj.program_summary._id : null);
				    			})
				    		},
				    		'basics.status': 'active',
				    		'issue_details.issued_to': user._id
			    		}
		    		},
		    		group: {
		    			$group: {
			    			_id: '$issue_details.program',
			    			count: { $sum: 1 }
			    		}
		    		}
		    	};
		    	hasActiveVouchersAggregate(q, callback);
		    }
		}, function(err, results) {
		    cb(results);
		});
	}
}

function hasActiveVouchersAggregate(q, callback) {
	Voucher.aggregate(q.match, q.group, function (err, results) {
		callback(null, results || []);
	})
}

function getCheckinCountAggregate(q, callback) {
	Checkin.aggregate(q.match, q.group, function (err, results) {
		callback(null, results || []);
	})
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

function getOutlets (lat, lon, distance, callback) {
	Outlet.find({
		
	}).
	select({
		'basics.name':1, 
		'contact.location': 1,
		'basics.is_a': 1,
		'contact.phones.mobile': 1
	}).exec(function (err, outlets) {
		callback(outlets || []);
	})
}