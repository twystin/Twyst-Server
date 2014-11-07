'use strict';

var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Outlet = mongoose.model('Outlet');
var Checkin = mongoose.model('Checkin');
var _ = require('underscore');
var async = require('async');

var costs = [100, 300, 500, 1000, 1500, 2000, 2500, 3000, 3500];

module.exports.get = function(req, res) {
	Outlet.find({
		'outlet_meta.accounts': req.user._id
	}, function(err, outlets) {
		if (err || !outlets) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		} else {
			getVouchers(outlets);
		}

	});

	function getVouchers(outlets) {
		var d = new Date(Date.now() - 7776000000);
		Voucher.count({
			'basics.status': 'merchant redeemed',
			'used_details.used_time': {
				$gte: d
			},
			'used_details.used_at': {
				$in: outlets.map(function(o) {
					return o._id;
				})
			}
		}, function(err, VoucherCount) {
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting Voucher Count',
					'info': err
				});
			} else if (VoucherCount === 0) {
				res.send(200, {
					'status': 'success',
					'message': 'No voucher redemeption in last three months',
					'info': ''
				})
			} else {
				calculateFigure(outlets, VoucherCount);
			}
		})
	}

	function calculateFigure(outlets, VoucherCount) {
		var roi = ((costs[outlets[0].attributes.cost_for_two.min] + costs[outlets[0].attributes.cost_for_two.max]) / 4) * VoucherCount
		res.send(200, {
			'status': 'success',
			'message': 'Successfully calculated ROI',
			'info': 'ROI for last 3 months is ' + roi,
			'outlet': outlets[0],
			'VoucherCount': VoucherCount
		});
	}
}

module.exports.getByTime = function(req, res) {
	console.log("here");
	var timeSpan = req.query.timespan;
	var current = new Date(Date.now());
	var dFirst = new Date(Date.now() - timeSpan);
	var dSecond = new Date(Date.now() - 2 * timeSpan);
	var recentCheckinsPerUser;
	var oldCheckinsPerUser;
	waterfallExecutor();

	function waterfallExecutor() {
		console.log("inside async");
		async.waterfall([

			function getOutlets(callback) {
				console.log("inside getOutlets");
				Outlet.find({
					'outlet_meta.accounts': req.user._id
				}, function(err, outlets) {
					if (err || !outlets) {
						res.send(400, {
							'status': 'error',
							'message': 'Error getting outlets',
							'info': err
						});
					} else {
						console.log(outlets.length);
					}
					callback(null, outlets);

				});
			},
			function getCheckinsRecent(outlets, callback) {
				console.log("inside getCheckinsRecent");
				Checkin.find({
					'outlet': {
						$in: outlets.map(function(o) {
							return o._id;
						})
					},
					'checkin_date': {
						$gte: dFirst,
						$lte: current
					}
				}, function(err, checkins) {
					if (err || !checkins) {
						res.send(400, {
							'status': 'error',
							'message': 'No recent checkins found',
							'info': err
						});
					} else {
						console.log(checkins.length);
						var recentUnique = _.map(_.indexBy(checkins, 'phone'), function(obj) {
							return obj
						});
						console.log(recentUnique.length);
						recentCheckinsPerUser = checkins.length / recentUnique.length;
						console.log("rc", recentCheckinsPerUser);
					}
					callback(null, outlets, recentCheckinsPerUser);
				})
			},
			function getCheckinsOld(outlets, recentCheckinsPerUser, callback) {
				console.log("inside getCheckinsOld");
				Checkin.find({
					'outlet': {
						$in: outlets.map(function(o) {
							return o._id;
						})
					},
					'checkin_date': {
						$gte: dSecond,
						$lte: dFirst
					}
				}, function(err, checkins) {
					if (err || !checkins) {
						res.send(400, {
							'status': 'error',
							'message': 'No old checkins found',
							'info': err
						});
					} else {
						console.log(checkins.length);
						var oldUnique = _.map(_.indexBy(checkins, 'phone'), function(obj) {
							return obj
						});
						console.log(oldUnique.length);
						oldCheckinsPerUser = checkins.length / oldUnique.length;
						console.log("oc", oldCheckinsPerUser);
					}
					callback(null, recentCheckinsPerUser / oldCheckinsPerUser);
				})
			}
		], function(err, results) {
			res.send(200, {
				'status': 'success',
				'message': 'Repeat user rate is ',
				'info': results
			})
		})
	}
}