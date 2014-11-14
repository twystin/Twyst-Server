var mongoose = require("mongoose");
var Voucher = mongoose.model('Voucher');
var async = require("async");
var CommonUtils = require('../../common/utilities');

module.exports.getRewards = function (req, res) {
	var start = req.query.start || 1,
		end = req.query.end || 20,
		user = req.user,
		lat = req.query.lat,
		lon = req.query.lon;

	getVoucher(user, function (err, vouchers) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting vouchers',
				'info': null
			})
		}
		else {
			var result = {
				total: 0,
				vouchers: []
			};
			result.total += (vouchers.ACTIVE.length + vouchers.MERCHANT_REDEEMED.length + vouchers.USER_REDEEMED.length);
			result.vouchers = vouchers;
			var filtered_vouchers = filterExpired(vouchers.ACTIVE);
			result.vouchers.ACTIVE = getInfo(filtered_vouchers.ACTIVE, lat, lon);
			result.vouchers.EXPIRED = filtered_vouchers.EXPIRED;
			res.send(200, {
				'status': 'success',
				'message': 'Got vouchers successfully.',
				'info': result
			})
		}
	})
}

function getInfo(active_vouchers, lat, lon) {
	var vouchers = [];
	if(!active_vouchers || !active_vouchers.length) {
		return [];
	}
	for(var i = 0; i < active_vouchers.length; i++) {
		var temp_obj = {
			voucher: active_vouchers[i],
			distance: -1,
			avail_in: -1
		}
		if(active_vouchers[i].issue_details.issued_at
			&& active_vouchers[i].issue_details.issued_at.length) {
			var MAX_DISTANCE = 20038; // MAX DISTANCE ON EARTH
			for(var j = 0; j < active_vouchers[i].issue_details.issued_at.length; j++) {
				var distance = calculateDistance(active_vouchers[i].issue_details.issued_at[j], lat, lon)
				if(distance < MAX_DISTANCE) {
					MAX_DISTANCE = distance;
					temp_obj.distance = distance;
				}
			}
		}
		temp_obj.avail_in = getAvailability(active_vouchers[i].issue_details.issued_for);
		vouchers.push(temp_obj);
	}
	return vouchers;
}

function getAvailability(offer) {
	return -1;
}

function calculateDistance(outlet, lat, lon) {
	var outlet_loc = outlet.contact.location.coords;
	var current_loc = {latitude: lat, longitude: lon};
	return CommonUtils.calculateDistance(outlet_loc, current_loc);
}

function filterExpired(vouchers) {
	var v = {
		ACTIVE: [],
		EXPIRED: []
	}
	if(!vouchers || !vouchers.length) {
		return v;
	}
	for(var i = 0; i < vouchers.length; i++) {
		var program_validity, program_type;
		if(vouchers[i].issue_details.program) {
			program_validity = vouchers[i].issue_details.program.validity;
			program_type = 'CHECKIN';
		}
		else if(vouchers[i].issue_details.winback) {
			program_validity = vouchers[i].validity;
			program_type = 'WINBACK';
		}
		else {
			// Other programs
		}
		if(isExpired(program_validity)) {
			v.EXPIRED.push(vouchers[i]);
		}
		else {
			var results = {};
			results.off_now = CommonUtils.isOpen(vouchers[i].issue_details.issued_for.avail_hours);
			results.availAt = null;
			if(results.closed_now) {
				results.availAt = CommonUtils.opensAt(results.OUTLET.issued_for.avail_hours);
			}
			console.log(results)
			v.ACTIVE.push(vouchers[i]);
		}
	}
	return v;
}

function isExpired(program_validity, program_type) {
	var time_now = new Date();
	if(program_type === 'CHECKIN') {
		return (new Date(program_validity.burn_start) < time_now
			&& time_now < new Date(program_validity.burn_end));
	}
	else if(program_type === 'WINBACK') {
		return (new Date(program_validity.start_date) < time_now
			&& time_now < new Date(program_validity.end_date));
	}
	return null;
}

function getVoucher (user, cb) {
	async.parallel({
	    ACTIVE: function(callback) {
	    	getActiveVoucher(user, callback);
	    },
	    USER_REDEEMED: function(callback) {
	    	getUserRedeemed(user, callback);
	    },
	    MERCHANT_REDEEMED: function(callback) {
	    	getRedeemed(user, callback);
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getUserRedeemed(user, cb) {
	Voucher.find({
		'issue_details.issued_to': user._id,
		'basics.status': 'user redeemed'
	})
	.populate('issue_details.issued_at')
	.populate('issue_details.issued_for')
	.populate('issue_details.program')
	.populate('issue_details.winback')
	.exec(function (err, vouchers) {
		cb(null, vouchers || []);
	})
}

function getActiveVoucher(user, cb) {
	Voucher.find({
		'issue_details.issued_to': user._id,
		'basics.created_at': {
			$lt: new Date(Date.now() - 10800000)
		},
		'basics.status': 'active'
	})
	.populate('issue_details.issued_at')
	.populate('issue_details.issued_for')
	.populate('issue_details.program')
	.populate('issue_details.winback')
	.exec(function (err, vouchers) {
		cb(null, vouchers || []);
	})
}

function getRedeemed(user, cb) {
	Voucher.find({
		'issue_details.issued_to': user._id,
		'basics.status': 'merchant redeemed'
	})
	.populate('issue_details.issued_at')
	.populate('issue_details.issued_for')
	.populate('issue_details.program')	
	.populate('issue_details.winback')
	.exec(function (err, vouchers) {
		cb(null, vouchers || []);
	})
}