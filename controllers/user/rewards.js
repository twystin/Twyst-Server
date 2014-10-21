var mongoose = require("mongoose");
var Voucher = mongoose.model('Voucher');
var async = require("async");

module.exports.getRewards = function (req, res) {
	var start = req.query.start || 1,
		end = req.query.end || 20,
		user = req.user;

	getInfo(user, function (err, vouchers) {
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
			result.total += vouchers.ACTIVE.length;
			result.total += vouchers.USER_REDEEMED.length;
			result.total += vouchers.MERCHANT_REDEEMED.length;
			result.vouchers = vouchers;
			res.send(200, {
				'status': 'success',
				'message': 'Got vouchers successfully.',
				'info': result
			})
		}
	})
}

function getInfo (user, cb) {
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
	.exec(function (err, vouchers) {
		cb(err, vouchers);
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
	.exec(function (err, vouchers) {
		cb(err, vouchers);
	})
}

function getRedeemed(user, cb) {
	Voucher.find({
		'issue_details.issued_to': user._id,
		'basics.status': 'merchant redeemed'
	})
	.populate('issue_details.issued_at')
	.exec(function (err, vouchers) {
		cb(err, vouchers);
	})
}