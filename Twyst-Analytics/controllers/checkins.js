var mongoose = require('mongoose');

var async = require('async');

var Checkin = mongoose.model('Checkin');
var Program = mongoose.model('Program');

var _ = require('underscore');
var dateFormat = require('dateformat');

module.exports.getCheckinMetric = function (req, res) {
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
	    TOTAL_CHECKINS: function(callback) {
	    	getTotalCheckins(q, callback);
	    },
	    CHECKINS_BY_DAY_OF_WEEK: function(callback) {
	    	getChekinsByDayOfWeek(q, callback);
	    },
	    CHECKINS_BY_MODE: function(callback) {
	    	getChekinsByMode(q, callback);
	    },
	    CHECKINS_BY_LOCATION: function(callback) {
	    	getChekinsByLocation(q, callback);
	    },
	    CHECKINS_BY_DATE: function (callback) {
	    	getCheckinsByDate(q, callback);
	    }
	}, function(err, results) {
	    res.send(200, {
        	'status': 'success',
        	'message': 'Got data successfully.',
        	'info': results
        });
	});

	function getTotalCheckins (query, callback) {
		Checkin.count(query, function (err, count) {
			callback(null, count || 0);
		})
	}

	function getChekinsByDayOfWeek(query, callback) {
		Checkin.aggregate({$match: query},
				{
					$project: {
						dayOfWeek: { $dayOfWeek: "$created_date" }
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

	function getChekinsByMode (query, callback) {
		Checkin.aggregate({$match: query},
					{ $group: 
						{ _id: '$checkin_type', count: { $sum: 1 }}
					}, function (err, op) {
						callback(null, op || []);
		});
	}

	function getChekinsByLocation (query, callback) {
		Checkin.aggregate({$match: query},
					{ $group: 
						{ _id: '$location', count: { $sum: 1 }}
					}, function (err, op) {
						callback(null, op || []);
		});
	}

	function getCheckinsByDate (query, callback) {
		Checkin.aggregate({$match: query},
				{
					$project: {
						_id: {
							dayOfMonth: { $dayOfMonth: "$created_date" },
							month: { $month: "$created_date" },
							year: { $year: "$created_date" }
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

module.exports.getCheckinData = function (req, res) {

	var functions = {
		'date': getUsersByDate,
		'week': getUsersByDayOfWeek,
		'mode': getUsersByMode,
		'location': getUsersByLocation
	};
	if(!req.body.programs || (req.body.programs.length === 0)) {
		res.send(400, {
        	'status': 'error',
        	'message': 'Error in request.',
        	'info': ''
        });
	}
	else {
		functions[req.body.data_type]();
	}
	
	function getMatchObject() {
		var q = {};
		if(req.body.outlets && req.body.outlet.length > 0) {
			q = {
				checkin_program : {
					$in: req.body.programs.map(
						function(id){
							return mongoose.Types.ObjectId(String(id)); 
					})
				},
				outlet: {
					$in: req.body.outlets.map(
						function(id){
							return mongoose.Types.ObjectId(String(id)); 
					})
				}
			}
		}
		else {
			q = {
				checkin_program : {
					$in: req.body.programs.map(
						function(id){
							return mongoose.Types.ObjectId(String(id)); 
					})
				}
			}
		}
		return q;
	}

	function getUsersByDayOfWeek() {
		Checkin.aggregate({$match: getMatchObject()},
				{
					$project: {
						_id: '$phone',
						dayOfWeek: { $dayOfWeek: "$created_date" }
					}
				}, {
					$match: {
						'dayOfWeek': req.body.day
					}
				}, function (err, op) {
					if(err) {
						res.send(400, {
				        	'status': 'success',
				        	'message': 'Error getting data.',
				        	'info': err
				        });
					}
					else {
						res.send(200, {
				        	'status': 'success',
				        	'message': 'Got data successfully.',
				        	'info': op
				        });
					}
		});
	}

	function getUsersByMode () {
		var q = getMatchObject();
		q.checkin_type = req.body.type;
		Checkin.aggregate({$match: q},
					{ $group: 
						{ _id: '$phone', count: { $sum: 1 }}
					}, function (err, op) {
						if(err) {
							res.send(400, {
					        	'status': 'success',
					        	'message': 'Error getting data.',
					        	'info': err
					        });
						}
						else {
							res.send(200, {
					        	'status': 'success',
					        	'message': 'Got data successfully.',
					        	'info': op
					        });
						}
		});
	}

	function getUsersByLocation () {
		var q = getMatchObject();
		q.location = req.body.location;
		Checkin.aggregate({$match: q},
					{ $group: 
						{ _id: '$phone', count: { $sum: 1 }}
					}, function (err, op) {
						if(err) {
							res.send(400, {
					        	'status': 'success',
					        	'message': 'Error getting data.',
					        	'info': err
					        });
						}
						else {
							res.send(200, {
					        	'status': 'success',
					        	'message': 'Got data successfully.',
					        	'info': op
					        });
						}
		});
	}

	function getUsersByDate () {
		var q = getMatchObject();
		q.created_date = {$gt: new Date(req.body.date), $lt: new Date(req.body.date * 1 + 24*60*60*1000)};
		Checkin.aggregate({$match: q},
					{ $group: 
						{ _id: '$phone', count: { $sum: 1 }}
					}, function (err, op) {
						if(err) {
							res.send(400, {
					        	'status': 'success',
					        	'message': 'Error getting data.',
					        	'info': err
					        });
						}
						else {
							res.send(200, {
					        	'status': 'success',
					        	'message': 'Got data successfully.',
					        	'info': op
					        });
						}
		});
	}
}