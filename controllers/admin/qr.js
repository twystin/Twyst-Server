var mongoose = require('mongoose');
var Qr = mongoose.model('Qr');

var async = require('async');

module.exports.getAllQrs = function (req, res) {
	var skip = 0, limit = 0, q;
	if(req.query.q) {
		q = {
			'code': new RegExp(req.query.q, "i")
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
		Qr.find(q, 
				{},  
				{sort: { 
					'created_date' : -1 
				},
				skip: skip, 
				limit: limit
			}).populate('outlet_id').exec(function (err, qrs) {

			callback(null, qrs || []);
		})
	}

	function getCount (q, callback) {
		Qr.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}

module.exports.updateValidity = function (req, res) {
	if(!req.body.qr) {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Request incomplete.',
            'info': ''
        });
	}
	else { 
		change();
	}

	function change() {
		Qr.findOne({_id: req.body.qr._id}, function (err, qr) {
			if(err) {
				res.send(400, {
			    	'status' : 'error',
	                'message' : 'Error getting qr.',
	                'info': err
	            });
			}
			else {
				if(!qr) {
					res.send(400, {
				    	'status' : 'error',
		                'message' : 'Qr not found.',
		                'info': ''
		            });
				}
				else {
					qr.validity = req.body.qr.validity;
					qr.save(function (err) {
						if(err) {
							res.send(400, {
						    	'status' : 'error',
				                'message' : 'Error getting qr.',
				                'info': err
				            });
						}
						else {
							res.send(200, {
						    	'status' : 'success',
				                'message' : 'successfully updated validity.',
				                'info': ''
				            });
						}
					});
				}
			}
		})
	}
}