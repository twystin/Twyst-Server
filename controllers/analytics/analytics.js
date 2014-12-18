var mongoose = require('mongoose'),
	async = require('async'),
	_ = require('underscore'); 

var Outlet = mongoose.model('Outlet'),
	Checkin = mongoose.model('Checkin'),
	Voucher = mongoose.model('Voucher');

module.exports.getDashBoard = function (req, res) {
	Outlet.find({
		'outlet_meta.accounts': req.user._id
	})
	.select('basics.name')
	.exec(function (err, outlets) {
		if(err || outlets.length < 1) {
			res.send(400,{
				'status': 'error',
				'message': 'Unable to get dashboard analytics',
				'info': err
			});
		}
		else {
			runInParallel(outlets);
		}
	});

	function runInParallel(outlets) {
		async.parallel({
		    checkins: function(callback) {
		    	getCheckins(outlets, callback);
		    },
		    redeem_count: function(callback) {
		    	getRedeemCount(outlets, callback);
		    }
		}, function(err, results) {
		    if(err) {
		    	res.send(200, {
			    	'status' : 'error',
	                'message' : 'Error getting dashboard data',
	                'info': err
	            });
		    }
		    else {
		    	var data = {
		    		checkin_count: results.checkins.checkin_count,
		    		redeem_count: results.redeem_count,
		    		user_count: results.checkins.user_count
		    	}
		    	res.send(200, {
			    	'status' : 'success',
	                'message' : 'Got dashboard data',
	                'info': data
	            });
		    }
		});
	}
}

function getCheckins(outlets, callback) {
	Checkin.find({
		checkin_date: {
			$gt: new Date(Date.now() - 60 * 86400000)
		},
		outlet: {
			$in: outlets.map(function (o) {
				return o._id;
			})
		}
	})
	.select('phone')
	.exec(function (err, checkins) {
		if(err) {
			callback(err, checkins);
		}
		else {
			var count = {
				checkin_count: checkins.length,
				user_count: 0
			};
			var unique = _.uniq(checkins, function (c) {
				return c.phone;
			})
			count.user_count = unique.length;
			callback(null, count);
		}
	})
}

function getRedeemCount(outlets, callback) {
	Voucher.count({
		'basics.status': 'merchant redeemed',
		'used_details.used_time': {
			$gt: new Date(Date.now() - 60 * 86400000)
		},
		'used_details.used_at': {
			$in: outlets.map(function (o) {
				return o._id;
			})
		}
	})
	.exec(function (err, count) {
		callback(err, count);
	})
}