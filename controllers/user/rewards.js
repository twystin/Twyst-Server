var mongoose = require("mongoose");
var Voucher = mongoose.model('Voucher');
var async = require("async");
var CommonUtils = require('../../common/utilities');

module.exports.getRewards = function (req, res) {
	var start = req.query.start || 1,
		end = req.query.end || 20,
		sort_by = req.query.sort_by || 'validity.end',
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
			result.vouchers.ACTIVE = getInfo(vouchers.ACTIVE, lat, lon);
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
		temp_obj.off_now = false;
		temp_obj.avail_in = null
		if(active_vouchers[i].issue_details.issued_for) {
			temp_obj.off_now = CommonUtils.isClosed(active_vouchers[i].issue_details.issued_for.avail_hours);
			if(temp_obj.off_now) {
				temp_obj.avail_in = CommonUtils.opensAt(active_vouchers[i].issue_details.issued_for.avail_hours);
			}
		}
		vouchers.push(temp_obj);
	}
	return vouchers;
}

function calculateDistance(outlet, lat, lon) {
	var outlet_loc = outlet.contact.location.coords;
	var current_loc = {latitude: lat, longitude: lon};
	return CommonUtils.calculateDistance(outlet_loc, current_loc);
}

function getVoucher (user, cb) {
	async.parallel({
	    ACTIVE: function(callback) {
	    	getActiveVoucher(user, callback);
	    },
	    EXPIRED: function(callback) {
	    	getExpiredVoucher(user, callback);
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

function getExpiredVoucher(user, cb) {
	Voucher.find({
		'issue_details.issued_to': user._id,
		'validity.end_date': {
			$lt: new Date()
		},
		'basics.status': 'active'
	})
	.populate('issue_details.issued_at')
	.populate('issue_details.issued_for')
	.populate('issue_details.program')
	.populate('issue_details.winback')
	.exec(function (err, vouchers) {
		cb(null, vouchers || []);
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
			$lt: new Date()
		},
		'validity.end_date': {
			$gt: new Date()
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