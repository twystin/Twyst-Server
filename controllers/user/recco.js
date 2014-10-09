var mongoose = require("mongoose");
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var async = require('async');
var _ = require("underscore");
var CommonUtils = require('../../common/utilities');

module.exports.getRecco = function (req, res) {
	var lat = req.query.lat,
		lon = req.query.lon,
		start = req.query.start || 1,
		end = req.query.end || 20;

	getOutlets({}, function (outlets) {
		getProgramsForOutlets(outlets, function (objects) {
			getIndependentUserData(function (results) {
				var unordered_set = computeReccoWeight(objects, results, lat, lon);
				var sorted_set = sortRecco(unordered_set);
				res.send(200, sorted_set)
			})
		});
	})
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
	Outlet.find({
		
	}).
	select({
		'basics.name':1, 
		'contact.location': 1
	}).exec(function (err, outlets) {
		callback(outlets || []);
	})
}