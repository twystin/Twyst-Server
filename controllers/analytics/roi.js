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
			'info': roi,
		});
	}
}

module.exports.repeatRate = function(req, res) {
	var timeSpan = req.query.timespan;
	var current = new Date(Date.now());
	var dFirst = new Date(Date.now() - timeSpan);
	var dSecond = new Date(Date.now() - 2 * timeSpan);
	var recentCheckinsPerUser;
	var oldCheckinsPerUser;
	waterfallExecutor();

	function waterfallExecutor() {
		async.waterfall([

			function getOutlets(callback) {
				Outlet.find({
					'outlet_meta.accounts': req.user._id
				})
				.select()
				.exec(function(err, outlets) {
					//console.log(outlets);
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
						$gte: dSecond
					}
				})
				.select({'phone':1, 'checkin_date':1})
				.exec(function(err, checkins) {
					checkins = _.sortBy(checkins, function(obj) { return obj.checkin_date;});
					var index = 0;
					for (var i = 0; i<checkins.length; i++){
						if (checkins[i].checkin_date > dFirst){
							index = i;
							break;
						}
					}
					var old = checkins.slice(0,index);
					var recent = checkins.slice(index); 
					var recentUnique = _.uniq(recent, function(obj) {
						return obj.phone
					});
					var oldUnique = _.uniq(old, function(obj) {
						return obj.phone
					});
					recentCheckinsPerUser = recent.length / recentUnique.length;
					oldCheckinsPerUser = old.length / oldUnique.length;
					callback(null, (recentCheckinsPerUser - 1 ) * 100);
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