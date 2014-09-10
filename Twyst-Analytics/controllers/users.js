var mongoose = require('mongoose');

var async = require('async');

var Checkin = mongoose.model('Checkin');
var Program = mongoose.model('Program');

module.exports.getUserMetric = function (req, res) {
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
					checkin_program : mongoose.Types.ObjectId(req.params.program),
					outlet: mongoose.Types.ObjectId(req.params.outlet)
				}
			}
			else {
				q = {
					checkin_program : mongoose.Types.ObjectId(req.params.program)
				}
			}
		}

		return q;
	}

	async.parallel({
	    USER_METRIC: function(callback) {
	    	getUserMetric(q, callback);
	    },
	    USER_BY_CHECKIN_NUMBER_METRIC: function(callback) {
	    	getCountByCheckinNumber(q, callback);
	    }
	}, function(err, results) {
	    res.send(200, {
        	'status': 'success',
        	'message': 'Got data successfully.',
        	'info': results
        });
	});

	function getUserMetric(query, callback) {
		Checkin.aggregate({$match: query},
				{ $group: { 
						_id: {
							phone:'$phone'
						}, 
						unique_outlets: { 
							$addToSet: '$outlet' 
						},
						outlets: {
							$push: '$outlet'
						}
					}
				}, function (err, op) {
					callback(null, assembleResult(op));
		});

		function assembleResult (op) {
			var users = {
				total: 0,
				gt_one_checkins: 0,
				cross: 0
			}
			if(!op) {
				return users;
			}
			users.total = op.length;
			op.forEach(function (o) {
				if(o.unique_outlets.length > 1) {
					++users.cross;
				}
				if(o.outlets.length > 1) {
					++users.gt_one_checkins;
				}
			})
			return users;
		}
	}

	function getCountByCheckinNumber(query, callback) {
		Checkin.aggregate({$match: query},
					{ $group: 
						{ _id: '$phone', count: { $sum: 1 }}
					}, {
						$group: {
							_id: '$count', num: { $sum: 1}
						}
					}, {
						$sort: {
							_id: 1
						}
					}, function (err, op) {
						callback(null, op || []);
		});
	}
}