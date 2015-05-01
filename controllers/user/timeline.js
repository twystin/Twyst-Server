var mongoose = require("mongoose"),
	Outlet = mongoose.model('Outlet'),
	Program = mongoose.model('Program')
	Voucher = mongoose.model('Voucher'),
	Checkin = mongoose.model('Checkin');
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
		});
		data.new_programs.forEach(function (p) {
			results.push(getProgramTimeline(p));
		});
		data.rewards.forEach(function (v) {
			results.push(getVoucherTimeline(v));
			if(v.basics.status === 'merchant redeemed') {
				results.push(getRedeemedTimeline(v));	
			}
		});
	}
	return results;
}

function getProgramTimeline(program) {
	var obj = {};
	obj.created_date = program.created_at;
	obj.message_object_type = "NEW_PROGRAM";
	obj.message = "New Rewards at "+ program.outlets[0].basics.name + ", " + program.outlets[0].contact.location.locality_1[0] + '! Check them out now.';
	obj.message_object = {
		'outlet_id': program.outlets[0]._id
	};

	return obj;
}

function getCheckinTimeline(checkin) {
	var obj = {};
	obj.created_date = checkin.created_date;
	obj.message_object_type = "CHECKIN";
	obj.message = "You checked-in at " + checkin.outlet.basics.name + ", " + checkin.outlet.contact.location.locality_1[0] + '.';
	obj.message_object = {
		'outlet_id': checkin.outlet._id
	};

	return obj;
}

function getVoucherTimeline(voucher) {
	var obj = {};
	obj.created_date = voucher.basics.created_at;
	obj.message_object_type = "VOUCHER_UNLOCKED";
	console.log("----------------------------");
	console.log(voucher);
	console.log("----------------------------");
	obj.message = "Voucher received from " + voucher.issue_details.issued_at[0].basics.name + ", "+ voucher.issue_details.issued_at[0].contact.location.locality_1[0] +".";
	obj.message_object = {
		'voucher_id': voucher._id
	};

	return obj;
}

function getRedeemedTimeline(voucher) {
	var obj = {};
	obj.created_date = voucher.basics.created_at;
	obj.message_object_type = "VOUCHER_USED";
	obj.message = "You used your voucher at " + voucher.used_details.used_at.basics.name + ", " + voucher.used_details.used_at.contact.location.locality_1[0] + ".";
	obj.message_object = {
		'outlet_id': voucher.used_details.used_at._id
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
	    },
	    new_programs: function (callback) {
	    	getNewPrograms(callback);
	    }
	}, function(err, results) {
	    cb(err, results);
	});
}

function getNewPrograms(cb) {
	Program.find({
		'created_at': {
			$gt: new Date(Date.now() - 864000000*2)
		},
		'status': 'active'
	})
	.select('outlets created_at')
	.populate('outlets')
	.exec(function (err, programs) {
		if(err) {
			cb(err, []);
		}
		else {
			cb(null, programs);
		}
	})
}

function getMyCheckins(user, cb) {
	Checkin.find({
		phone: user.phone
	})
	.select('created_date outlet')
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
			$lt: new Date()
		}
	})
	.select('issue_details.issued_at used_details.used_at basics.created_at')
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