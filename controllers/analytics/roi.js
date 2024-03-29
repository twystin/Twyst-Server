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
	})
	.select({
		'basics.name': 1,
		'attributes.cost_for_two': 1
	})
	.exec(function(err, outlets) {
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
		Voucher.count({
			'basics.status': 'merchant redeemed',
			'used_details.used_time': {
				$gt: new Date(Date.now() - 60 * 86400000)
			},
			'used_details.used_at': {
				$in: outlets.map(function(o) {
					return o._id;
				})
			}
		}, function(err, voucher_count) {
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting Voucher Count',
					'info': err
				});
			} else {
				if (!voucher_count) {
					res.send(200, {
						'status': 'success',
						'message': 'No voucher redemeption in last three months',
						'info': 0
					})
				} else {
					calculateFigure(outlets, voucher_count);
				}
			}
		})
	}

	function calculateFigure(outlets, VoucherCount) {
		var roi = ((costs[outlets[0].attributes.cost_for_two.min - 1] + costs[outlets[0].attributes.cost_for_two.max - 1]) / 2) * VoucherCount
		res.send(200, {
			'status': 'success',
			'message': 'Successfully calculated ROI',
			'info': roi
		});
	}
}

module.exports.repeatRate = function(req, res) {
	var timeSpan = req.query.timespan;
	var checkinsPerUser;
	waterfallExecutor();

	function waterfallExecutor() {
		async.waterfall([

			function getOutlets(callback) {
				Outlet.find({
					'outlet_meta.accounts': req.user._id
				})
				.select({
					'basics.name': 1
				})
				.exec(function(err, outlets) {
					callback(null, outlets);
				});
			},

			function getCheckinsRecent(outlets, callback) {
				outlets = _.map(outlets, function(currentObject) {
				    return _.pick(currentObject, "_id");
				});
				Checkin.find({
					'outlet': {
						$in: outlets
					},
					'checkin_date': {
						$gte: new Date(Date.now() - timeSpan)
					}
				})
				.select({'phone':1, 'checkin_date':1})
				.exec(function(err, checkins) {
					var unique_checkins = _.uniq(checkins, function(obj) {
						return obj.phone
					});
					checkinsPerUser = checkins.length / unique_checkins.length;
					callback(null, (checkinsPerUser - 1) * 100);
				})
			}
		], function(err, results) {
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error',
					'info': err
				});
			} else {
				res.send(200, {
					'status': 'success',
					'message': 'Repeat user rate is ',
					'info': results
				})
			}
		})
	}
}