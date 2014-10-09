var mongoose = require("mongoose");
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var async = require('async');
var CommonUtils = require('../../common/utilities');

module.exports.getNearby = function (req, res) {
	var lat = req.query.lat,
		lon = req.query.lon,
		distance = req.query.distance || 5;

	getOutlets(lat, lon, distance, function (outlets) {
		getProgramsForOutlets(outlets, function (objects) {
			getOtherInfos(req.user, 
				objects, 
				{
					latitude: lat, 
					longitude: lon
				}, function (results) {
					res.send(200, results);
			})
		});
	})
}

function getOtherInfos(user, objects, loc, cb) {
	var length = objects.length;
	if(!length) {
		cb([]);
	}
	if(!user) {
		objects.forEach(function (obj) {
			var outlet_loc = obj.outlet_summary.contact.location.coords;
			obj.distance = CommonUtils.calculateDistance(loc, outlet_loc);
			obj.checkin_count = 0;
	    	obj.active_reward = false;
		});
		cb(objects);
	}
	else {
		getInfoForAuthUser(objects, user, function (data) {
			objects.forEach(function (o) {
				var outlet_loc = o.outlet_summary.contact.location.coords;
				o.distance = CommonUtils.calculateDistance(loc, outlet_loc);
				o.checkin_count = getCheckinCount(o.program_summary, data.checkin_counts);
				o.active_reward = hasActiveVoucher(o.program_summary, data.active_rewards)
			})
    		cb(objects);
		})
	}
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
		'contact.location.coords': {
			$near: [lon, lat], 
			$maxDistance: distance/112,
			spherical: true
		}
	}).
	select({
		'basics.name':1, 
		'contact.location': 1
	}).exec(function (err, outlets) {
		callback(outlets || []);
	})
}