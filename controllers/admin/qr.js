var mongoose = require('mongoose');
var Qr = mongoose.model('Qr');

var async = require('async');

module.exports.getAllQrs = function (req, res) {
	var skip = 0, limit = 0, q;
	if(req.params.outlet_id) {
		q = {
			'outlet_id': req.params.outlet_id
		}
		if(req.query.q) {
			q.code = new RegExp(req.query.q, "i");
		}
	}
	else {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Request requires outlet_id',
            'info': null
        });
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
	    QRS: function(callback) {
	    	getQrs(q, callback);
	    },
	    totalCount: function(callback) {
	    	getCount(q, callback);
	    }
	}, function(err, results) {
	    res.send(200, {
	    	'status' : 'success',
            'message' : 'Got qrs.',
            'info': results
        });
	});

	function getQrs (q, callback) {
		Qr.find(q)
		.skip(skip)
		.limit(limit)
		.sort({'validity.end': -1})
		.populate('outlet_id')
		.exec(function (err, qrs) {
			callback(null, qrs || []);
		});
	}

	function getCount (q, callback) {
		Qr.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}

module.exports.updateValidity = function (req, res) {
	if(!validateRequest()) {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Request incomplete',
            'info': null
        });
	}
	else { 
		changeValidity(req.body, function (err, num) {
			if(err) {
				res.send(400, {
			    	'status' : 'error',
		            'message' : 'Request incomplete',
		            'info': null
		        });
			}
			else {
				res.send(200, {
			    	'status' : 'success',
	                'message' : 'successfully updated validity',
	                'info': num
	            });
			}
		});
	}

	function changeValidity(data, cb) {
		delete data.__v;
		Qr.update({
	        _id: {
	        	$in: data.ids
	        }
	    }, {
	        validity: data.validity
	    }, {
	        multi: true
	    }).exec(function (err, num) {
	        cb(err, num)
	    })
	}

	function validateRequest() {
		if(req.body.ids 
			&& req.body.ids.length 
			&& req.body.validity) {
			return true;
		}
		return false;
	}
}