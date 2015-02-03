var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var UserLoc = mongoose.model('UserLoc');
var async = require('async');

module.exports.getAllUsers = function (req, res) {
	var skip = 0, limit = 0, q;
	if(req.query.q) {
		q = {
			$or:[{
					'username': new RegExp(req.query.q, "i")
				}, 
				{
					'social_graph.email.email': new RegExp(req.query.q, "i")
				}
			]
		}
	}
	else {
		q = {};
	}

	if(req.query.role && req.query.role !== 'All') {
		q.role = req.query.role;
	}
	else {
		q.role = {
			$ne: 6
		}
	}

	initQuery();

	function initQuery () {
		if(!req.query.totalCountPerPage) {
			limit = 10;
		}
		else {
			limit = req.query.totalCountPerPage;
		}
		if(!req.query.pageNumber) {
			skip = 0;
		}
		else {
			skip = ((req.query.pageNumber * 1) - 1) * limit
		}
	}

	async.parallel({
	    USERS: function(callback) {
	    	getUsers(q, callback);
	    },
	    totalCount: function(callback) {
	    	getCount(q, callback);
	    }
	}, function(err, results) {
	    if(err) {
	    	res.send(400, {
		    	'status' : 'error',
	            'message' : 'Error Getting users.',
	            'info': err
	        });
	    }
	    else {
	    	res.send(200, {
		    	'status' : 'success',
	            'message' : 'Got users.',
	            'info': results
	        });
	    }
	});

	function getUsers (q, callback) {
		var sortQuery={};
		sortQuery[req.query.sortBy] = req.query.sortOrder;
		Account.find(q)
			.select('-hash -salt')
			.sort(sortQuery)
			.skip(skip)
			.limit(limit)
			.lean()
			.exec(function (err, users) {
			callback(err, users);
		})
	}

	function getCount (q, callback) {
		Account.count(q, function (err, count) {
			callback(err, count || 0);
		})
	}
}

module.exports.getUser = function (req, res) {
	if(!req.params.username) {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Error Getting user',
            'info': err
        });
	}
	else {
		getUser(req.params.username, function (err, user) {
			if(err) {
				res.send(400, {
			    	'status' : 'error',
		            'message' : 'Error Getting user',
		            'info': err
		        });
			}
			else {
				res.send(200, {
			    	'status' : 'success',
		            'message' : 'Got user.',
		            'info': user
		        });
			}
		});
	}

	function getUser(username, cb) {
		Account.findOne({
			username: username
		})
		.select('-hash -salt')
		.exec(function (err, user) {
			cb(err, user);
		})
	}
}

module.exports.updateUser = function(req, res) {
	var update_user = {};
	update_user = _.extend(update_user, req.body);
	delete update_user._id; 
	delete update_user.username;
	Account.findOneAndUpdate(
	{username:req.params.username}, 
	{$set: update_user}, 
	{upsert:true},
	function(err) {
		if (err) {
			res.send(400, {	
				'status': 'error',
				'message': 'Error updating user ',
				'info': err
			});
		} else {
			res.send(200, {	
				'status': 'success',
				'message': 'Successfully updated user',
				'info': null
			});
		}
	});	
}