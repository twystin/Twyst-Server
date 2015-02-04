var mongoose = require('mongoose'),
	async = require('async'),
	_ = require('underscore');
var Account = mongoose.model('Account'),
	Checkin = mongoose.model('Checkin'),
	Voucher = mongoose.model('Voucher');

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
		var q = {
			username: req.params.username
		};
		getUser(q, function (err, user) {
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
}

function getUser(q, cb) {
	Account.findOne(q)
	.select('-hash -salt')
	.exec(function (err, user) {
		cb(err, user);
	})
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

module.exports.getTimeline = function (req, res) {
	var result = {
		phone: req.body.phone,
		data: []
	};
	if(!result.phone) {
		res.send(400, {	
			'status': 'error',
			'message': 'Phone number required',
			'info': null
		});
	}
	else {
		var q = {
			phone: result.phone
		};
		getUser(q, function (err, user) {
			if(err) {
				res.send(400, {	
					'status': 'error',
					'message': 'Error getting user',
					'info': err
				});
			}
			else {
				if(!user) {
					res.send(400, {	
						'status': 'error',
						'message': 'User not registered with us',
						'info': null
					});
				}
				else {
					getDetails(user, function (err, data) {
						if(err) {
							res.send(400, {	
								'status': 'error',
								'message': 'Error getting details',
								'info': err
							});
						}
						else {
							res.send(200, {
								'status': 'success',
								'message': 'Got details Successfully',
								'info': result
							});
						}
					})
				}
			}
		})
	}

	function getDetails(user, cb) {
		async.parallel({
		    CHECKINS: function(callback) {
		    	getCheckins(user.phone, callback);
		    },
		    VOUCHERS: function(callback) {
		    	getVouchers(user._id, callback);
		    }
		}, function(err, results) {
		    cb(err, filterTimeline(results));
		});
	}

	function filterTimeline(data) {
		if(!data) {
			return;
		}
		if(data.CHECKINS) {
			data.CHECKINS.forEach(function (c) {
				var obj = {
					'type': 'CHECKIN',
					'time': c.created_date,
					'details': c
				};
				result.data.push(obj);
			});
		}
		if(data.VOUCHERS) {
			data.VOUCHERS.forEach(function (v) {
				var obj = {
					'type': 'UNLOCK',
					'time': v.basics.created_at,
					'details': v
				};
				result.data.push(obj);
				if(v.basics.status !== 'active') {
					var obj = {
						'type': 'REDEEM',
						'time': v.used_details.used_time,
						'details': v
					};
					result.data.push(obj);
				}
			});
		}
		return sortTimeline();
	}

	function sortTimeline() {
		if(!result.data.length) {
			return;
		}
		result.data = _.sortBy(result.data, function (r) {
			return -r.time;
		});
		return;
	}

	function getCheckins(phone, cb) {
		Checkin.find({
			phone: phone
		})
		.populate('outlet')
		.exec(function (err, checkins) {
			cb(err, checkins);
		})
	}

	function getVouchers(user_id, cb) {
		Voucher.find({
			'issue_details.issued_to': user_id
		})
		.populate('issue_details.issued_at')
		.populate('used_details.used_at')
		.select('basics issue_details.issued_at used_details terms')
		.exec(function (err, vouchers) {
			cb(err, vouchers);
		})
	}
}