var mongoose = require('mongoose');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');

module.exports.getCounts = function (req, res) {

	var counts = {
		'checkin_count': null,
		'voucher_count': null,
		'redeem_count': null
	};
	var outlet_id, program_id;

	if(!req.params.outlet_id) {
		res.send(400, {
			'status': 'error',
			'message': 'Outlet missing in request',
			'info': JSON.stringify(err)
		});
	}
	else {
		if(req.params.program_id !== 'ALL') {
			var q_checkins = {
				'outlet' : req.params.outlet_id,
				'checkin_program' : req.params.program_id,
				'checkin_type' : {
					$ne: 'BATCH'
				}
			};
			var q_voucher = {
				'issue_details.issued_at' : req.params.outlet_id,
				'issue_details.program' : req.params.program_id
			};
			var q_redeem = {
				'used_details.used_at' : req.params.outlet_id,
				'issue_details.program' : req.params.program_id,
				'basics.status': {
					$ne: 'active'
				}
			}
		}
		else {
			var q_checkins = {
				'outlet' : req.params.outlet_id,
				'checkin_type' : {
					$ne: 'BATCH'
				}
			};
			var q_voucher = {
				'issue_details.issued_at' : req.params.outlet_id
			}
			var q_redeem = {
				'used_details.used_at' : req.params.outlet_id,
				'basics.status': {
					$ne: 'active'
				}
			}
		}
		getCheckinCount();
	}

	function getCheckinCount () {

		Checkin.count(q_checkins, function (err, count) {

			if(err) {
				counts.checkin_count = null;
			}
			else {
				counts.checkin_count = count;
			}
			getVoucherCount();
		});
	}

	function getVoucherCount () {

		Voucher.count(q_voucher, function (err, count) {

			if(err) {
				counts.voucher_count = null;
			}
			else {
				counts.voucher_count = count;
			}
			getRedeemCount();
		});
	}

	function getRedeemCount () {

		Voucher.count(q_redeem, function (err, count) {

			if(err) {
				counts.redeem_count = null;
			}
			else {
				counts.redeem_count = count;
			}
			res.send(200, {
				'status': 'success',
				'message': 'Got count successfully',
				'info': counts
			})
		});
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

