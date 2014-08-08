var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var async = require('async');

module.exports.getVouchers = function (req, res) {
	var outlet = null, program = null, skip = 0, limit = 0, q;
	if(req.params.outlet && req.params.program) {
		outlet = req.params.outlet;
		program = req.params.program;
		initData();
		if(program === 'ALL') {
			q = {
				'issue_details.issued_at': outlet
			};
		}
		else {
			q = {
				'issue_details.issued_at': outlet,
				'issue_details.program': program
			}
		}
		getVouchers(q);
	}
	else {
		res.send(400, {'status' : 'error',
                'message' : 'Error getting vouchers.',
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

	function getVouchers (q) {
		async.parallel({
		    VOUCHERS: function(callback) {
		    	getVouchersData(q, callback);
		    },
		    totalCount: function(callback) {
		    	getCount(q, callback);
		    }
		}, function(err, results) {
		    res.send(200, {
		    	'status' : 'success',
                'message' : 'Got vouchers.',
                'info': results
            });
		});
	}

	function getVouchersData (q, callback) {
		Voucher.find(q, 
				{}, 
				{sort: { 
					'issue_details.issue_time' : -1  
				},
				skip: skip, 
				limit: limit
			}).populate('issue_details.issued_to')
			.populate('issue_details.program')
			.exec(function (err, vouchers) {

				callback(null, vouchers || []);
		});
	}

	function getCount (q, callback) {
		Voucher.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}

module.exports.getRedeems = function (req, res) {
	var outlet = null, program = null, skip = 0, limit = 0, q;
	if(req.params.outlet && req.params.program) {
		outlet = req.params.outlet;
		program = req.params.program;
		initData();
		if(program === 'ALL') {
			q = {
				'used_details.used_at': outlet,
				'basics.status': 'merchant redeemed'
			};
		}
		else {
			q = {
				'used_details.used_at': outlet, 
				'issue_details.program': program,
				'basics.status': 'merchant redeemed'
			}
		}
		getRedeems(q);
	}
	else {
		res.send(400, {'status' : 'error',
                'message' : 'Error getting redeemes.',
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

	function getRedeems (q) {
		async.parallel({
		    REDEEMS: function(callback) {
		    	getRedeemsData(q, callback);
		    },
		    totalCount: function(callback) {
		    	getCount(q, callback);
		    }
		}, function(err, results) {
		    res.send(200, {
		    	'status' : 'success',
                'message' : 'Got vouchers.',
                'info': results
            });
		});
	}

	function getRedeemsData (q, callback) {
		Voucher.find(q, 
				{}, 
				{sort: { 
					'used_details.used_date' : -1 
				},
				skip: skip, 
				limit: limit
			}).populate('issue_details.issued_to')
			.populate('used_details.used_at')
			.exec(function (err, vouchers) {

				callback(null, vouchers || []);
		});
	}

	function getCount (q, callback) {
		Voucher.count(q, function (err, count) {
			callback(null, count || 0);
		})
	}
}