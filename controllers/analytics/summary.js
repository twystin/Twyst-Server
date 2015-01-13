var mongoose = require('mongoose'),
	_ = require('underscore'),
	async = require('async');
var Program = mongoose.model('Program'),
	Offer = mongoose.model('Offer'),
	Tier = mongoose.model('Tier'),
	Checkin = mongoose.model('Checkin'),
	Voucher = mongoose.model('Voucher');

module.exports.getCounts = function (req, res) {

	var outlet_id = req.params.outlet_id,
		program_id = req.params.program_id;

	if(!outlet_id) {
		res.send(400, {
			'status': 'error',
			'message': 'Outlet missing in request',
			'info': err
		});
	}
	else {
		var q = getQuery(outlet_id, program_id);
		paralletCounter(q, function (err, counts) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting counts',
					'info': err
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Got count successfully',
					'info': counts
				});
			}
		});
	}

	function paralletCounter(q, cb) {
		async.parallel({
            checkin_count: function(callback) {
                getCheckinsCount(q, function (err, count) {
                    callback(err, count);
                });
            },
            voucher_count: function(callback) {
                getVouchersCount(q, function (err, count) {
                    callback(err, count);
                });
            },
            redeem_count: function (callback) {
            	getRedeemsCount(q, function (err, count) {
                    callback(err, count);
                });
            }
        }, function(err, results) {
            cb(err, results);
        });
	}

	function getCheckinsCount(q, callback) {
		Checkin.count(q.checkins)
		.exec(function (err, count) {
			callback(err, count);
		})
	}

	function getVouchersCount(q, callback) {
		Voucher.count(q.vouchers)
		.exec(function (err, count) {
			callback(err, count);
		})
	}

	function getRedeemsCount(q, callback) {
		Voucher.count(q.redeems)
		.exec(function (err, count) {
			callback(err, count);
		})
	}

	function getQuery (outlet_id, program_id) {
		var q = {};
		if(program_id !== 'ALL') {
			q.checkins = {
				'outlet' : outlet_id,
				'checkin_program' : program_id,
				'checkin_type' : {
					$ne: 'BATCH'
				}
			};
			q.vouchers = {
				'issue_details.issued_at' : outlet_id,
				'issue_details.program' : program_id
			};
			q.redeems = {
				'used_details.used_at' : outlet_id,
				'issue_details.program' : program_id,
				'basics.status': 'merchant redeemed'
			}
		}
		else {
			q.checkins = {
				'outlet' : outlet_id,
				'checkin_type' : {
					$ne: 'BATCH'
				}
			};
			q.vouchers = {
				'issue_details.issued_at' : outlet_id
			}
			q.redeems = {
				'used_details.used_at' : outlet_id,
				'basics.status': 'merchant redeemed'
			}
		}
		return q;
	}
}

module.exports.getSummaryCheckins = function (req, res) {
	var program_id = req.params.program_id;
	var checkin = true;
	var voucher = false;
	readProgram(program_id, res, checkin, voucher);
}

module.exports.getSummaryVouchers = function (req, res) {
	var program_id = req.params.program_id;
	var voucher = true;
	var checkin = false;
	readProgram(program_id, res, checkin, voucher);
}

function readProgram(program_id, res, checkin, voucher) {
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
				if(checkin) {
					getAllCheckins(program, res);
				}
				if(voucher) {
					getAllVouchers(program, res);
				}
			}
		}
	});
};



function getAllCheckins(program, res) {

	var results = [];
	var result = {};
	var len = program.tiers.length;
	program.tiers.forEach(function (tier) {
		checkinData(tier);
	});

	function checkinData(tier) {
		Checkin.aggregate({	$match: { checkin_for: {
        				$in: tier.offers.map(
        					function(id){ 
        						return mongoose.Types.ObjectId(String(id)); 
        				})}}
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
        })
	}

	function assembleResult(tier, op) {
		result.tier = tier;
		result.customer_count = op.length;
		result.total_checkins = 0;
		result.in_tier = 0;
		op.forEach(function(item) {
			result.total_checkins += item.count+tier.basics.start_value-1;
			result.in_tier += item.count;
		});
		results.push(result);
		result = {};
		len--
		if(len === 0) {
			res.send(200, {
					'status': 'success',
					'message': 'Got checkin analytics',
					'info': JSON.stringify(results)
			});
		}
	}
}

function getAllVouchers (program, res) {

	var results = [];
	var result = {};
	var len = program.tiers.length;
	program.tiers.forEach(function (tier) {
		voucherData(tier);
	});
	function voucherData(tier) {
		Voucher.aggregate({	$match: {  "issue_details.issued_for": {
        				$in: tier.offers.map(
        					function(id){ 
        						return mongoose.Types.ObjectId(String(id)); 
        				})}}
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
		result = {};
		len--;
		if(len == 0) {
			res.send(200, {
					'status': 'success',
					'message': 'Got voucher analytics',
					'info': JSON.stringify(results)
			});
		}
	}
}

