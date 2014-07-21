var mongoose = require('mongoose');
var Checkin = mongoose.model('Checkin');
var async = require('async');

module.exports.getCheckins = function (req, res) {
	var outlet = null, program = null, skip = 0, limit = 0, q;
	if(req.params.outlet && req.params.program) {
		outlet = req.params.outlet;
		program = req.params.program;
		initData();
		if(program === 'ALL') {
			q = {
				'outlet': outlet
			};
		}
		else {
			q = {
				'outlet': outlet,
				'checkin_program': program
			}
		}
		getCheckins(q);
	}
	else {
		res.send(400, {'status' : 'error',
                'message' : 'Error getting checkins.',
                'info': '' });
	}
	
	function initData () {
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

	function getCheckins (q) {
		async.parallel({
		    CHECKINS: function(callback) {
		    	getCheckinsData(q, callback);
		    },
		    totalCount: function(callback) {
		    	getCount(q, callback);
		    }
		}, function(err, results) {
		    res.send(200, {
		    	'status' : 'success',
                'message' : 'Got checkins.',
                'info': results
            });
		});
	}

	function getCheckinsData (q, callback) {
		Checkin.find(q, 
				{}, 
				{sort: { 
					'created_date' : -1 
				},
				skip: skip, 
				limit: limit
			}, function (err, checkins) {

				callback(null, checkins || []);
		});
	}

	function getCount (q, callback) {
		Checkin.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}