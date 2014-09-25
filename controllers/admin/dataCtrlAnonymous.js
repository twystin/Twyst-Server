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

module.exports.getAnonData = function (req, res) {

	var outlets = req.body.outlets;
	var start = req.body.start || Date.now() - 7 * 24 * 60 * 60 * 1000;
	var end = req.body.end || Date.now();
	var RANGES = [];

	if(outlets.length > 0) {
		getRange(start, end);
		parallelExecuter(outlets);
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
		for(var i = start; i <= (end+3000); i += day_in_milliseond) {
			RANGES.push(i);
		}
	}

	function parallelExecuter(outlets) {
		async.parallel({
		    CHECKINS: function(callback) {
		    	getCheckinDetails(outlets, callback);
		    },
		    CHECKINS_DAILY: function(callback) {
		    	getCheckinDaily(outlets, callback);
		    },
		    VOUCHERS: function(callback) {
		    	getVoucherDetails(outlets, callback);
		    },
		    VOUCHERS_DAILY: function(callback) {
		    	getVoucherDaily(outlets, callback);
		    },
		    USERS_BY_CHECKIN_NO: function(callback) {
		    	groupByCheckinNumber(outlets, callback);
		    },
		    USERS_BY_APP: function(callback) {
		    	groupByApp(callback);
		    }
		}, function(err, results) {
		    res.send(200,results);
		});
	};

	function getCheckinDetails(outlets, callback) {
		checkinData();		
		function checkinData() {
			Checkin.aggregate({	$match: { outlet: {
									$in: outlets.map(function(id) {
										return mongoose.Types.ObjectId(id);
									})
								},
								created_date: {
									$gt: new Date(start),
									$lt: new Date(end)
								}
		        			}
	        			},
	        			{ $group: 
	        				{ _id: '$checkin_type', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				console.log(err)
	        				assembleResult(op);
	        });
		}

		function assembleResult(op) {
			result = {};
			op.forEach(function(item) {
				if(item._id === 'PANEL') {
					result.PANEL = item.count;
				}
				if(item._id === 'QR') {
					result.QR = item.count;
				}
				if(item._id === 'SMS') {
					result.SMS = item.count;
				}
				if(item._id === 'BATCH') {
					result.BATCH = item.count;
				}
			});
			countTotal(result);
		}

		function countTotal(result) {
			Checkin.count({outlet: {
				$in: outlets
			}}, function (err, count) {
				if(err) {
					count = 0;
				}
				callback(null, {RESULTS: result, TOTAL: count});
			});
		};
	};


	function getCheckinDaily(outlets, callback) {

		checkinData();
		function checkinData() {
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

			Checkin.aggregate({	$match: { outlet: {
									$in: outlets.map(function(id) {
										return mongoose.Types.ObjectId(id);
									})
								},
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
					    	callback(null, {RESULTS: op});
					    }
			);
		};
	};

	function getVoucherDetails(outlets, callback) {
		voucherData();
		function voucherData() {
			Voucher.aggregate({	$match: {  "issue_details.issued_at": {
		        				$in: outlets.map(
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
	        				assembleResult(op);
	        })
		}

		function assembleResult(op) {
			var result = {};
			result.earned = 0;
			result.redeemed = 0;
			op.forEach(function(item) {
				result.earned += item.count;
				if(item._id !== 'active') {
					result.redeemed += item.count;
				}
			});
			
			countTotalVouchers(result);
		};

		function countTotalVouchers(result) {
			Voucher.aggregate({	$match: {  "issue_details.issued_at": {
							$in: outlets.map(function(id) {
								return mongoose.Types.ObjectId(String(id));
							})
						}
	        			}},
	        			{$project: {
				                key: '$basics.status'
				            }
				        },
	        			{ $group: 
	        				{ _id: '$key', count: { $sum: 1 }}
	        			}, function (err, op) {
	        				countResult(op, result);
	        })
		};

		function countResult(op, result) {
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
			callback(null, {RESULTS: result, TOTAL: TOTAL});
		};
	};

	function getVoucherDaily(outlets, callback) {

		voucherData();
		
		function voucherData() {
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
			Voucher.aggregate({	$match: {  "issue_details.issued_at": {
									$in: outlets.map(function(id) {
										return  mongoose.Types.ObjectId(String(id));
									})
								},
		        				'issue_details.issue_time': {
		        					$gt: new Date(start),
									$lt: new Date(end) 
		        				},
		        				"basics.status": {
		        					$in: [
		        						'user redeemed', 'merchant redeemed'
		        					]
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
					    	callback(null, {RESULTS: op});
					    }
			);
		};
	};

	function groupByCheckinNumber(outlets, callback) {
		Checkin.aggregate({	$match: { outlet: {
								$in: outlets.map(function(id) {
									return mongoose.Types.ObjectId(id);
								})
							}
	        			}
        			},
        			{ $group: 
        				{ _id: '$phone', count: { $sum: 1 }}
        			},
        			{
        				$group: {
        					_id: '$count', value: {$sum: 1}
        				}
        			}, {
        				$sort: { 
								"_id": 1 
							}
        			}, function (err, op) {
        				callback(null, {DATA: op});
        });
	};

	function groupByApp(callback) {
		async.parallel({
		    APP_USERS: function(app_callback) {
		    	getAppUsers(app_callback);
		    },
		    NON_APP_USERS: function(app_callback) {
		    	getNonAppUsers(app_callback);
		    }
		}, function(err, results) {
		    callback(null, {RESULTS: results});
		});

		function getAppUsers(app_callback) {
			Account.count({ 
					$where: "this.username != this.phone" 
				}, function (err, count) {
					if(err) {
						count = 0;
					}
				app_callback(null, count);
			});
		};

		function getNonAppUsers(app_callback) {
			Account.count({ 
					$where: "this.username == this.phone" 
				}, function (err, count) {
					if(err) {
						count = 0;
					}
				app_callback(null, count);
			});
		};
	};
}

module.exports.totalCheckins = function (req, res) {
	Checkin.count({}, function (err, total_checkins) {
		res.send(200, {
			'status': 'success',
			'message': 'total checkins',
			'info': total_checkins
		})
	});
}