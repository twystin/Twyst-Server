var mongoose = require('mongoose'),
	async = require('async'),
	CacheCtrl = require('../cacheCtrl'),
	RewardCtrl = require('../reward_populate');
var Outlet = mongoose.model('Outlet'),
	Reward = mongoose.model('Reward'),
	Program = mongoose.model('Program'),
	SpecialProgram = mongoose.model('SpecialProgram'),
	Voucher = mongoose.model('Voucher')
	_ = require('underscore');

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
					delete outlet.__v;
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
							if(outlet.outlet_meta.status === 'archived') {
								Voucher.find({'issue_details.issued_at': {$in: [outlet._id]}}, function(err, vouchers) {
									if(err) console.log(err);
									var voucher;
									//console.log('getting vouchers for outlet ' + vouchers);
									_.map(vouchers, function(voucher) {
										if(voucher.basics.status === 'active') {
											voucher.basics.status = 'expired'	
										}
										voucher.save(function(err) {
											if(err) console.log(err);
										})
									})
									
									res.send(200, {
								    	'status' : 'success',
						                'message' : 'successfully updated status.',
						                'info': ''
						            });
									
								})	
							}
						}
					});
				}
			}
		})
	}
}

module.exports.changeProgramStatus = function (req, res) {
	if(!req.body.program_id || !req.body.status) {
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
		Program.findOne({
			_id: req.body.program_id
		}, function (err, program) {
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
					program.status = req.body.status;
					program.save(function (err) {
						if(err) {
							res.send(400, {
						    	'status' : 'error',
				                'message' : 'Error updating status',
				                'info': err
				            });
						}
						else {
							CacheCtrl.clear();
							RewardCtrl.createRewardTable(program._id, function (err, data) {
								if(err) {
									res.send(200, {
								    	'status' : 'error',
						                'message' : 'Updated status, Reward table error',
						                'info': err
						            });
								}
								else {
									res.send(200, {
								    	'status' : 'success',
						                'message' : 'successfully updated status, populated reward',
						                'info': ''
						            });
								}
							})
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
            'message' : 'Got outlets.',
            'info': results
        });
	});

	function getOutlets (q, callback) {
		Outlet.find(q, 
				{},  
				{sort: { 
					'basics.created_at' : -1 
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

module.exports.getSpecialPrograms = function(req,res) {
	SpecialProgram.find(function(e,p) {
		res.send(200,p);
	})
}

module.exports.getAllPrograms = function (req, res) {
	var skip = 0, limit = 0, q;
	initQuery();
	if(req.query.q) {
		var outlet_q = {
			'basics.name': new RegExp(req.query.q, "i")
		}
		getOutlets(outlet_q, function (outlets) {
			q = {
				$or: [
					{'name': new RegExp(req.query.q, "i")},
					{'outlets': {
						$in: outlets.map(function (obj) {
							return obj._id;
						})
					}}
				]
			}
			runInParallel();
		});
	}
	else {
		q = {};
		runInParallel();
	}

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

	function runInParallel() {
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
	            'message' : 'Got programs.',
	            'info': results
	        });
		});
	}

	function getPrograms (q, callback) {
		var sortQuery={};
		sortQuery[req.query.sortBy] = req.query.sortOrder;
		Program.find(q)
				.sort(sortQuery)
				.skip(skip)
				.limit(limit)
				.exec(function (err, programs) {

			callback(null, programs || []);
		})
	}

	function getCount (q, callback) {
		Program.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}

	function getOutlets (q, callback) {
		Outlet.find(q).select({'basics.name': 1}).exec(function (err, outlets) {

			callback(outlets || []);
		})
	}
}