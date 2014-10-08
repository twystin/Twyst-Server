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
			getOtherInfos(req.user, objects, {latitude: lat, longitude: lon}, function (results) {
				res.send(200, results);
			})
		});
	})
}

function getOtherInfos(user, objects, loc, cb) {
	var length = objects.length;
	if(!length) {
		callback([]);
	}
	if(!user) {
		objects.forEach(function (obj) {
			var outlet_loc = obj.outlet_summary.contact.location.coords;
			obj.distance = CommonUtils.calculateDistance(loc, outlet_loc);
			obj.checkin_count = 0;
	    	obj.active_reward = false;
	    	if(--length == 0) {
	    		cb(objects);
	    	}
		})
	}
	else {
		objects.forEach(function (obj) {
			var outlet_loc = obj.outlet_summary.contact.location.coords;
			obj.distance = CommonUtils.calculateDistance(loc, outlet_loc);
			getInfoForAuthUser(obj, user, function (data) {
				obj.checkin_count = data.checkin_count;
	    		obj.active_reward = data.active_reward;
	    		if(--length == 0) {
		    		cb(objects);
		    	}
			})
		})
	}
}

function getInfoForAuthUser(obj, user, cb) {
	async.parallel({
	    checkin_count: function(callback) {
	    	if(!obj.program_summary) {
	    		callback(null, 0);
	    	}
	    	else {
	    		var q = {
		    		outlet: obj.outlet_summary._id, 
		    		checkin_program: obj.program_summary._id,
		    		phone: user.phone
		    	};
		    	getCheckinCount(q, callback);
	    	}
	    },
	    active_reward: function(callback) {
	    	if(!obj.program_summary) {
	    		callback(null, false);
	    	}
	    	else {
	    		var q = { 
		    		'issue_details.program': obj.program_summary._id,
		    		'issue_details.issued_to': user._id
		    	};
		    	hasActiveVoucher(q, callback);
	    	}
	    }
	}, function(err, results) {
	    obj.checkin_count = results.checkin_count;
	    obj.active_reward = results.active_reward;
	    cb(obj);
	});
}

function hasActiveVoucher(q, callback) {
	Voucher.findOne(q, function (err, voucher) {
		callback(null, voucher ? true : false);
	})
}

function getCheckinCount(q, callback) {
	Checkin.count(q, function (err, count) {
		callback(null, count || 0);
	})
}

function getProgramsForOutlets(outlets, callback) {
	var length = outlets.length,
		objects = [];
	if(!length) {
		callback(objects);
	}
	outlets.forEach(function (outlet) {
		var obj = {};
		obj.outlet_summary = outlet;
		getProgram(outlet._id, function (program) {
			obj.program_summary = program;
			objects.push(obj);
			if(--length == 0) {
				callback(objects);
			}
		})
	});
}

function getProgram(outlet_id, callback) {
	Program.findOne({outlets: outlet_id}, function(err, program) {
		callback(program || null);
	});
}

function getOutlets (lat, lon, distance, callback) {
	Outlet.find({
		'contact.location.coords': {
			$near: [lat, lon], 
			$maxDistance: distance/69 
		}
	}).select({'basics.name':1, 'contact.location': 1}).exec(function (err, outlets) {
		callback(outlets || []);
	})
}