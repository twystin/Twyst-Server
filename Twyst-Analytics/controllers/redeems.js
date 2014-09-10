var mongoose = require('mongoose');

var async = require('async');

var Voucher = mongoose.model('Voucher');
var Program = mongoose.model('Program');

var _ = require('underscore');
var dateFormat = require('dateFormat');

module.exports.getRedeemMetric = function (req, res) {
	var q = getQueryObject();
	function getQueryObject () {
		var q = {};
		if(!req.params.program) {
			res.send(400, {
            	'status': 'error',
            	'message': 'Error in request.',
            	'info': ''
            });
		}
		else {
			if(req.params.outlet && req.params.outlet !== 'ALL') {
				q = {
					'basics.status': 'merchant redeemed',
					'issue_details.program' : mongoose.Types.ObjectId(req.params.program),
					'used_details.used_at': mongoose.Types.ObjectId(req.params.outlet)
				}
			}
			else {
				q = {
					'basics.status': 'merchant redeemed',
					'issue_details.program' : mongoose.Types.ObjectId(req.params.program)
				}
			}
		}

		return q;
	}

	async.parallel({
	    TOTAL_REDEEMS: function(callback) {
	    	getTotalRedeems(q, callback);
	    },
	    REDEEMS_BY_DAY_OF_WEEK: function(callback) {
	    	getRedeemsByDayOfWeek(q, callback);
	    },
	    REDEEMS_BY_DATE: function (callback) {
	    	getRedeemsByDate(q, callback);
	    }
	}, function(err, results) {
	    res.send(200, {
        	'status': 'success',
        	'message': 'Got data successfully.',
        	'info': results
        });
	});

	function getTotalRedeems (query, callback) {
		Voucher.count(query, function (err, count) {
			callback(null, count || 0);
		})
	}

	function getRedeemsByDayOfWeek(query, callback) {
		Voucher.aggregate({$match: query},
				{
					$project: {
						dayOfWeek: { $dayOfWeek: "$issue_details.issue_date" }
					}
				},
				{ $group: { 
						_id: '$dayOfWeek',
						count: {$sum: 1}
					}
				}, {
					$sort: {_id: 1}
				}, function (err, op) {
					callback(null, op || []);
		});
	}

	function getRedeemsByDate (query, callback) {
		Voucher.aggregate({$match: query},
				{
					$project: {
						_id: {
							dayOfMonth: { $dayOfMonth: "$issue_details.issue_date" },
							month: { $month: "$issue_details.issue_date" },
							year: { $year: "$issue_details.issue_date" }
						}
					}
				},
				{ $group: { 
						_id: '$_id',
						count: {$sum: 1}
					}
				}, {
					$sort: {_id: 1}
				}, function (err, op) {
					callback(null, assembleResult(op));
		});

		function assembleResult (op) {
			if(!op || op.length < 1) {
				return [];
			}

			op.forEach(function (o) {
				o.actual_date = new Date(o._id.year, o._id.month - 1, o._id.dayOfMonth);
				o.actual_date = dateFormat(o.actual_date, "yyyy-m-dd");
				delete o._id;
			});
			op = _.sortBy(op, function(o) {
				return - o.actual_date;
			})
			return op;
		}
	}
}