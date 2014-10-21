var mongoose = require("mongoose");
var Voucher = mongoose.model('Voucher');
var Checkin = mongoose.model('Checkin');
var Utils = require('../../common/utilities');
var async = require("async");
var _ = require("underscore");

module.exports.getTimeline = function (req, res) {
	var start = req.query.start || 1,
		end = req.query.end || 20,
		user = req.user;

	getInfo(user, function (err, data) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting timeline',
				'info': null
			})
		}
		else {
			var result = {};
			result.total = getTotal(data);
			result.results = assembleResults(data);
			result.results = sortTimeline(result.results);
			res.send(200, {
				'status': 'success',
				'message': 'Got timeline successfully.',
				'info': result
			})
		}
	})
}

function getTotal(data) {
	var total = 0;
	total += ((data && data.checkins) ? data.checkins.length : 0);
	total += ((data && data.rewards) ? data.rewards.length : 0);
	return total;
}

function cutResults (results, start, end) {
	return results.slice(start - 1, end);
}

function sortTimeline(unordered_set) {
	var sorted_set = _.sortBy(unordered_set, function (s){
		return -s.created_date;
	});
	return sorted_set;
}

function assembleResults(data) {
	var results = [];
	if(!data || (!data.checkins && !data.vouchers)) {
		return results;
	}
	else {
		data.checkins.forEach(function (c) {
			results.push(getCheckinTimeline(c));
		})
		data.rewards.forEach(function (v) {
			results.push(getVoucherTimeline(v));
			if(v.basics.status === 'merchant redeemed') {
				results.push(getRedeemedTimeline(v));	
			}
		})
	}
	return results;
}

function getCheckinTimeline(checkin) {
	var obj = {};
	obj.created_date = checkin.created_date;
	obj.message_object_type = "CHECKIN";
	obj.message = "You checked-in at " + checkin.outlet.basics.name + " on " + Utils.formatDate(checkin.created_date) +" .";
	obj.message_object = {
		'checkin': checkin
	};

	return obj;
}

function getVoucherTimeline(voucher) {
	var obj = {};
	obj.created_date = voucher.basics.created_at;
	obj.message_object_type = "VOUCHER_UNLOCKED";
	obj.message = "You unlocked a voucher at " + voucher.issue_details.issued_at[0].basics.name + " on " + Utils.formatDate(voucher.basics.created_at) +" .";
	obj.message_object = {
		'voucher': voucher
	};

	return obj;
}

function getRedeemedTimeline(voucher) {
	var obj = {};
	obj.created_date = voucher.basics.created_at;
	obj.message_object_type = "VOUCHER_USED";
	obj.message = "You used your voucher at " + voucher.used_details.used_at.basics.name + " on " + Utils.formatDate(voucher.used_details.used_time) +" .";
	obj.message_object = {
		'voucher': voucher
	};

	return obj;
}

function getInfo(user, cb) {
	async.parallel({
	    checkins: function(callback) {
	    	getMyCheckins(user, callback);
	    },
	    rewards: function(callback) {
	    	getMyRewards(user, callback);
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getMyCheckins(user, cb) {
	Checkin.find({
		phone: user.phone
	})
	.populate('outlet')
	.exec(function (err, checkins) {
		if(err) {
			cb(err, []);
		}
		else {
			cb(null, checkins);
		}
	})
}

function getMyRewards(user, cb) {
	Voucher.find({
		'issue_details.issued_to': user._id,
		'basics.created_at': {
			$lt: new Date(Date.now() - 10800000)
		}
	})
	.populate('issue_details.issued_at')
	.populate('used_details.used_at')
	.exec(function (err, vouchers) {
		if(err) {
			cb(err, []);
		}
		else {
			cb(null, vouchers);
		}
	})
}