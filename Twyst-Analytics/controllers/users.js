var mongoose = require('mongoose');

var async = require('async');

var Checkin = mongoose.model('Checkin');
var Program = mongoose.model('Program');

module.exports.getUserMetric = function (req, res) {

	if(!req.body.programs || (req.body.programs.length === 0)) {
		res.send(400, {
        	'status': 'error',
        	'message': 'Error in request.',
        	'info': ''
        });
	}
	else {
		parallelExecutor();
	}
	
	function getMatchObject() {
		var q = {};
		if(req.body.outlets && req.body.outlets.length > 0) {
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

	function parallelExecutor() {
		async.parallel({
		    USER_METRIC: function(callback) {
		    	getUserMetric(getMatchObject(), callback);
		    },
		    USER_BY_CHECKIN_NUMBER_METRIC: function(callback) {
		    	getCountByCheckinNumber(getMatchObject(), callback);
		    }
		}, function(err, results) {
		    res.send(200, {
	        	'status': 'success',
	        	'message': 'Got data successfully.',
	        	'info': results
	        });
		});
	}

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

module.exports.getUserData = function (req, res) {

	var functions = {
		'unique': getUniqueUsers,
		'cross': getCrossVisitingUsers,
		'multiple': getUsersWithGtOneCheckins,
		'checkin_number': getUserByCheckinNumber 
	}

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
		if(req.body.outlets && req.body.outlets.length > 0) {
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

	function getUserByCheckinNumber () {
		Checkin.aggregate({$match: getMatchObject()},
				{ $group: { 
						_id: '$phone',
						count: {$sum: 1}
					}
				}, {
					$match: {
						count: {
							$eq: req.body.checkin_count
						}
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

	function getUniqueUsers() {
		Checkin.aggregate({$match: getMatchObject()},
				{ $group: { 
						_id: '$phone',
						outlets: {
							$push: '$outlet'
						}
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

	function getUsersWithGtOneCheckins() {
		Checkin.aggregate({$match: getMatchObject()},
				{ $group: { 
						_id: '$phone',
						outlets: {
							$push: '$outlet'
						}
					}
				}, {
					$project: {
			            numofOutletsChecked: { $size: "$outlets" }
			         }
				}, {
					$match: {
						numofOutletsChecked: {
							$gt: 1
						}
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

	function getCrossVisitingUsers() {
		Checkin.aggregate({$match: getMatchObject()},
				{ $group: { 
						_id: '$phone', 
						unique_outlets: { 
							$addToSet: '$outlet' 
						}
					}
				}, {
					$project: {
			            numofOutletsChecked: { $size: "$unique_outlets" }
			         }
				}, {
					$match: {
						numofOutletsChecked: {
							$gt: 1
						}
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
}