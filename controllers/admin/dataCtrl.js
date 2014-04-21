var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var async = require('async');

module.exports.getOutlets = function (req, res) {

	var cities = req.params.cities || [];
	var merchant = req.params.merchant;
	
	if(merchant && cities.length > 0) {
		cities = cities.split(',');
		find();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Error getting outlets.',
			'info': ''
		});
	}

	function find() {
		Outlet.find({
			'outlet_meta.accounts': merchant,
			'contact.location.city': {
				$in: cities
			}}).select({'basics.name':1, 'contact.location.locality_1': 1}).exec(function (err, outlets) {
			
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting outlets.',
					'info': JSON.stringify(err)
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got outlets.',
					'info': outlets
				});
			}
		})
	}
}

module.exports.getMerchants = function (req, res) {

	Account.find({
		'role': 3 
		}).select({'username':1}).exec(function (err, merchants) {
		
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting merchants.',
				'info': JSON.stringify(err)
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got merchants.',
				'info': merchants
			});
		}
	});
}

module.exports.getPrograms = function (req, res) {

	var outlets = req.params.outlets || [];
	
	if(outlets.length > 0) {
		outlets = outlets.split(',');
		find();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Error getting programs.',
			'info': ''
		});
	}

	function find() {
		Program.find({
			'outlets': {
				$in: outlets.map(
        					function(id){ 
        						return mongoose.Types.ObjectId(String(id)); 
        				})
			}}).select({'name':1}).exec(function (err, programs) {
			
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting programs.',
					'info': JSON.stringify(err)
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got programs.',
					'info': programs
				});
			}
		});
	};
}

module.exports.getData = function (req, res) {
	
	var program = req.params.program;
	var start = req.params.start || Date.now() - 7 * 24 * 60 * 60 * 1000;
	var end = req.params.end || Date.now();

	start = Number(start);
	end = Number(end);

	var RANGES = [];
	
	var data = {
		'CHECKINS': {},
		'VOUCHERS': {},
		'USERS': {}
	};

	if(program) {
		getProgramDetails(program);
		getRange(start, end);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Error getting data.',
			'info': ''
		});
	}

	function getRange (start, end) {
		var day_in_milliseond = 24 * 60 * 60 * 1000;
		for(var i = start; i <= end; i += day_in_milliseond) {
			RANGES.push(i);
		}
	}

	function getProgramDetails(program_id) {
		Program.findOne({_id: program_id}).populate('tiers').exec(function (err, program) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting programs',
					'info': JSON.stringify(err)
				});
			}
			else {
				if (!program) {
					res.send(200, {
						'status': 'success',
						'message': 'Program not found',
						'info': JSON.stringify(programs)
					});
				}
				else {
					parallelExecuter(program);
				}
			}
		});
	};

	function parallelExecuter(program) {
		async.parallel({
		    CHECKINS: function(callback) {
		    	getCheckinDetails(program, callback);
		    },
		    CHECKINS_DAILY: function(callback) {
		    	getCheckinDaily(program, callback);
		    },
		    VOUCHERS: function(callback) {
		    	getVoucherDetails(program, callback);
		    },
		    VOUCHERS_DAILY: function(callback) {
		    	getVoucherDaily(program, callback);
		    },
		    USERS: function(callback) {
		    	getUsers(program, callback);
		    }
		}, function(err, results) {
		    res.send(200,results);
		});
	};

	function getCheckinDetails(program, callback) {

		var len = program.tiers.length;
		var results = [];

		if(len < 1) {
			callback(null, 'ERROR');
		}
		else {
			program.tiers.forEach(function (tier) {
				checkinData(tier);
			});
		}
		
		function checkinData(tier) {
			Checkin.aggregate({	$match: { checkin_tier: 
								mongoose.Types.ObjectId(String(tier._id)),
								created_date: {
									$gt: new Date(start),
									$lt: new Date(end)
								}
		        			}
	        			},
	        			{ $group: 
	        				{ _id: '$phone', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				if(err) {
	        					assembleResult(tier, op);
	        				}
	        				else {
	        					assembleResult(tier, op);
	        				}
	        });
		}

		function assembleResult(tier, op) {
			result = {};
			result.tier = tier;
			result.customer_count = op.length;
			result.total_checkins = 0;
			result.in_tier = 0;
			op.forEach(function(item) {
				result.total_checkins += item.count+tier.basics.start_value-1;
				result.in_tier += item.count;
			});
			results.push(result);
			len--;
			if(len === 0) {
				countTotal();		
			}
		}

		function countTotal() {
			Checkin.count({checkin_program: program._id}, function (err, count) {
				if(err) {
					count = 0;
				}
				callback(null, {RESULTS: results, TOTAL: count});
			});
		};
	};

	function getCheckinDaily(program, callback) {

		var len = program.tiers.length;
		var results = [];

		if(len < 1) {
			callback(null, 'ERROR');
		}
		else {
			program.tiers.forEach(function (tier) {
				checkinData(tier);
			});
		}
		
		function checkinData(tier) {
			var rangeProj = { "$concat": [] };
			for (var i=1; i<RANGES.length; i++ ) {
			    rangeProj.$concat.push( {
			        $cond: [ { $and: [
			           { $gte: [ "$created_date", new Date(RANGES[i-1]) ] },
			           { $lt:  [ "$created_date", new Date(RANGES[i]) ] }
			           ]}, "" +RANGES[i-1], "" 
			        ]
			    });
			};

			Checkin.aggregate({	$match: { checkin_tier: 
								mongoose.Types.ObjectId(String(tier._id)),
								created_date: {
									$gt: new Date(start),
									$lt: new Date(end)
								}
			    			}
						},{ 
							$project: { 
								"_id": 0, "range": rangeProj 
							} 
						},{ 
							$group: { 
								_id: "$range", 
								count: { 
									$sum: 1 
								} 
							} 
						},	{ 
							$sort: { 
								"_id": 1 
							} 
						}, function(err, op) {
					    	console.log(err || op);
					    	assembleResult(tier, op);
					    }
			);
		}

		function assembleResult(tier, op) {
			result = {};
			result.tier = tier;
			result.data = op;
			results.push(result);
			len--;
			if(len === 0) {
				callback(null, {RESULTS: results});		
			}
		};
	};

	function getVoucherDetails(program, callback) {
		var results = [];

		var len = program.tiers.length;
		program.tiers.forEach(function (tier) {
			voucherData(tier);
		});
		function voucherData(tier) {
			Voucher.aggregate({	$match: {  "issue_details.issued_for": {
		        				$in: tier.offers.map(
		        					function(id){ 
		        						return mongoose.Types.ObjectId(String(id)); 
		        				})},
		        				'issue_details.issue_time': {
		        					$gt: new Date(start),
									$lt: new Date(end) 
		        				}
	        				}
	        			},
	        			{$project: {
				                key: '$basics.status'
				            }
				        },
	        			{ $group: 
	        				{ _id: '$key', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				if(err) {
	        					assembleResult(tier, op);
	        				}
	        				else {
	        					assembleResult(tier, op);
	        				}
	        })
		}

		function assembleResult(tier, op) {
			var result = {};
			result.tier = tier;
			result.earned = 0;
			result.redeemed = 0;
			op.forEach(function(item) {
				result.earned += item.count;
				if(item._id === 'merchant redeemed' || item._id === 'user redeemed') {
					result.redeemed += item.count;
				}
			});
			results.push(result);
			len--;
			if(len === 0) {
				countTotalVouchers();
			}
		};

		function countTotalVouchers() {
			Voucher.aggregate({	$match: {  "issue_details.program":
		        				mongoose.Types.ObjectId(String(program._id))
	        			}},
	        			{$project: {
				                key: '$basics.status'
				            }
				        },
	        			{ $group: 
	        				{ _id: '$key', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				countResult(op);
	        })
		};

		function countResult(op) {
			var TOTAL = {
				'EARNED': 0,
				'REDEEMED': 0
			};
			op.forEach(function(item) {
				TOTAL.EARNED += item.count;
				if(item._id === 'merchant redeemed' || item._id === 'user redeemed') {
					TOTAL.REDEEMED += item.count;
				}
			});
			callback(null, {RESULTS: results, TOTAL: TOTAL});
		};
	};

	function getVoucherDaily(program, callback) {

		var len = program.tiers.length;
		var results = [];

		if(len < 1) {
			callback(null, 'ERROR');
		}
		else {
			program.tiers.forEach(function (tier) {
				voucherData(tier);
			});
		}
		
		function voucherData(tier) {
			var rangeProj = { "$concat": [] };
			for (var i=1; i<RANGES.length; i++ ) {
			    rangeProj.$concat.push( {
			        $cond: [ { $and: [
			           { $gte: [ "$basics.created_at", new Date(RANGES[i-1]) ] },
			           { $lt:  [ "$basics.created_at", new Date(RANGES[i]) ] }
			           ]}, "" +RANGES[i-1], "" 
			        ]
			    });
			};

			Voucher.aggregate({	$match: {  "issue_details.issued_for": {
		        				$in: tier.offers.map(
		        					function(id){ 
		        						return mongoose.Types.ObjectId(String(id)); 
		        				})},
		        				'issue_details.issue_time': {
		        					$gt: new Date(start),
									$lt: new Date(end) 
		        				}
	        				}
	        			},{ 
							$project: { 
								"_id": 0, "range": rangeProj 
							} 
						},{ 
							$group: { 
								_id: "$range", 
								count: { 
									$sum: 1 
								} 
							} 
						},	{ 
							$sort: { 
								"_id": 1 
							} 
						}, function(err, op) {
					    	console.log(err || op);
					    	assembleResult(tier, op);
					    }
			);
		}

		function assembleResult(tier, op) {
			result = {};
			result.tier = tier;
			result.data = op;
			results.push(result);
			len--;
			if(len === 0) {
				callback(null, {RESULTS: results});		
			}
		};
	};

	function getUsers(program, callback) {

		(function countUsersByCheckinTypeInRange() {
			Checkin.aggregate({	$match: { checkin_program: 
								mongoose.Types.ObjectId(String(program._id)),
								created_date: {
									$gt: new Date(start),
									$lt: new Date(end)
								}
		        			}
	        			},
	        			{ $group: 
	        				{ _id: '$checkin_type', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				var data = assembleResult(op);
	        				countUsersByCheckinTypeTotal(data);
	        });
		})();

		function countUsersByCheckinTypeTotal(RANGE_DATA) {
			Checkin.aggregate({	$match: { checkin_program: 
								mongoose.Types.ObjectId(String(program._id))
		        			}
	        			},
	        			{ $group: 
	        				{ _id: '$checkin_type', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				var data = assembleResult(op);
	        				callback(null, {RANGE: RANGE_DATA, TOTAL: data});
	        });
		}

		function assembleResult(op) {
			var USERS_BY_CHECKIN_TYPE = {
				'PANEL': 0,
				'QR': 0,
				'SMS': 0
			};
			op.forEach(function(item) {
				if(item._id === 'PANEL') {
					USERS_BY_CHECKIN_TYPE.PANEL = item.count;
				}
				if(item._id === 'QR') {
					USERS_BY_CHECKIN_TYPE.QR = item.count;
				}
				if(item._id === 'SMS') {
					USERS_BY_CHECKIN_TYPE.SMS = item.count;
				}
			});
			return USERS_BY_CHECKIN_TYPE;
		};
	};
}