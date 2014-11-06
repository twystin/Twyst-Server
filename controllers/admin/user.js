var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var UserLoc = mongoose.model('UserLoc');
var async = require('async');

module.exports.getAllUsers = function (req, res) {
	var skip = 0, limit = 0, q;
	if(req.query.q) {
		q = {
			'username': new RegExp(req.query.q, "i")
		}
	}
	else {
		q = {};
	}

	if(req.query.role && req.query.role !== 'All') {
		q.role = req.query.role;
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
	    res.send(200, {
	    	'status' : 'success',
            'message' : 'Got users.',
            'info': results
        });
	});

	function getUsers (q, callback) {
		var sortQuery={};
		sortQuery[req.query.sortBy] = req.query.sortOrder;
		Account.find(q, 
				{},  
				{sort: sortQuery,
				skip: skip, 
				limit: limit
			}).lean().exec(function (err, users) {
				getUsersLastSeen(users, callback);
		})
	}

	function getCount (q, callback) {
		Account.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}

	function getUsersLastSeen(users, callback) {
		var length = users.length;
		if(!length) {
			callback(null, users || []);
		}
		users.forEach(function (user) {
			getLastSeenLocation(user, function (time) {
				length--;
				user.last_seen = time;
				if(!length) {
					callback(null, users || []);
				}
			});
		})
	}

	function getLastSeenLocation(user, cb) {
		if(!isAppUser(user)) {
			cb(null);
		}
		else {
			UserLoc.findOne({account: user._id}, function (err, loc) {
				if(err || !loc) {
					cb(null);
				}
				else {
					cb(loc.locations[loc.locations.length - 1].logged_time);
				}
			})
		}
	}

	function isAppUser(user) {
		if(user.role === 7) {
			return true;
		}
		return false;
	}
}