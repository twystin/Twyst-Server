var mongoose = require('mongoose');
var Account = mongoose.model('Account');

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
		Account.find(q, 
				{},  
				{sort: { 
					'created_at' : -1 
				},
				skip: skip, 
				limit: limit
			}, function (err, users) {

			callback(null, users || []);
		})
	}

	function getCount (q, callback) {
		Account.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}