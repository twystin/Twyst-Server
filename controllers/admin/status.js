var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var async = require('async');

var CacheCtrl = require('../cacheCtrl.js');

module.exports.changeOutletStatus = function (req, res) {
	if(!req.body.outlet) {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Request incomplete.',
            'info': ''
        });
	}
	else {
		changeStatus();
	}

	function changeStatus() {
		Outlet.findOne({_id: req.body.outlet._id}, function (err, outlet) {
			if(err) {
				res.send(400, {
			    	'status' : 'error',
	                'message' : 'Error getting outlet.',
	                'info': err
	            });
			}
			else {
				if(!outlet) {
					res.send(400, {
				    	'status' : 'error',
		                'message' : 'Outlet not found.',
		                'info': ''
		            });
				}
				else {
					outlet.outlet_meta.status = req.body.outlet.outlet_meta.status;
					outlet.save(function (err) {
						if(err) {
							res.send(400, {
						    	'status' : 'error',
				                'message' : 'Error getting outlet.',
				                'info': err
				            });
						}
						else {
							CacheCtrl.clear();
							res.send(200, {
						    	'status' : 'success',
				                'message' : 'successfully updated status.',
				                'info': ''
				            });
						}
					});
				}
			}
		})
	}
}

module.exports.changeProgramStatus = function (req, res) {
	if(!req.body.program) {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Request incomplete.',
            'info': ''
        });
	}
	else {
		changeStatus();
	}

	function changeStatus() {
		Program.findOne({_id: req.body.program._id}, function (err, program) {
			if(err) {
				res.send(400, {
			    	'status' : 'error',
	                'message' : 'Error getting program.',
	                'info': err
	            });
			}
			else {
				if(!program) {
					res.send(400, {
				    	'status' : 'error',
		                'message' : 'Program not found.',
		                'info': ''
		            });
				}
				else {
					program.status = req.body.program.status;
					program.save(function (err) {
						if(err) {
							res.send(400, {
						    	'status' : 'error',
				                'message' : 'Error getting program.',
				                'info': err
				            });
						}
						else {
							CacheCtrl.clear();
							res.send(200, {
						    	'status' : 'success',
				                'message' : 'successfully updated status.',
				                'info': ''
				            });
						}
					});
				}
			}
		})
	}
}

module.exports.getAllOutlets = function (req, res) {
	var skip = 0, limit = 0, q;
	if(req.query.q) {
		q = {
			'basics.name': new RegExp(req.query.q, "i")
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
	    OUTLETS: function(callback) {
	    	getOutlets(q, callback);
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

	function getOutlets (q, callback) {
		Outlet.find(q, 
				{}, 
				{sort: { 
					'created_at' : -1 
				},
				skip: skip, 
				limit: limit
			}, function (err, outlets) {

			callback(null, outlets || []);
		})
	}

	function getCount (q, callback) {
		Outlet.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}

module.exports.getAllPrograms = function (req, res) {
	var skip = 0, limit = 0, q;
	if(req.query.q) {
		q = {
			'name': new RegExp(req.query.q, "i")
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
	    PROGRAMS: function(callback) {
	    	getPrograms(q, callback);
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

	function getPrograms (q, callback) {
		Program.find(q, 
				{}, 
				{sort: { 
					'created_at' : -1 
				},
				skip: skip, 
				limit: limit
			}, function (err, programs) {

			callback(null, programs || []);
		})
	}

	function getCount (q, callback) {
		Program.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}