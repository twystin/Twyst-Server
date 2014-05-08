var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var Favourite = mongoose.model('Favourite');
var async = require('async');


module.exports.getNotifs = function (req, res) {

	var skip = req.params.skip || 0;

	Outlet.find({'outlet_meta.accounts': req.user._id}, function (err, outlets) {
		if(err || outlets.length < 1) {
			res.send(400,{
				'status': 'error',
				'message': 'Unable to get voucher analytics',
				'info': JSON.stringify(err)
			});
		}
		else {			
			parallelExecutor(outlets, skip);
		}
	});

	function parallelExecutor(outlets, skip) {
		async.parallel({
		    CHECKINS: function(callback) {
		    	getCheckinNotifs(outlets, skip, callback);
		    },
		    VOUCHERS: function(callback) {
		    	getVoucherNotifs(outlets, skip, callback);
		    },
		    REDEEMS: function(callback) {
		    	getRedeemNotifs(outlets, skip, callback);
		    },		   
		    FAVS: function(callback) {
		    	getFavNotifs(outlets, skip, callback);
		    }
		}, function(err, results) {
		    sortResults(results);
		});
	};

	function sortResults(results) {
		var data = [];
		data = data.concat(results.CHECKINS);
		data = data.concat(results.VOUCHERS);
		data = data.concat(results.REDEEMS);
		data = data.concat(results.FAVS);

		// _.sortBy(data, function(item) {
		// 	return -(item.date);
		// });
		data.sort(date_sort_desc);
		
		res.send(200, {
			'status': 'success',
			'message': 'Successfully got notifications',
			'info': data
		});
	}

	var date_sort_desc = function (a, b) {
		// This is a comparison function that will result in dates being sorted in
		// DESCENDING order.
		if (a.date > b.date) return -1;
		if (a.date < b.date) return 1;
		return 0;
	};

	function getCheckinNotifs(outlets, skip, callback) {
		Checkin.find(
			{outlet: {
				$in: outlets.map(
					function(item){ 
						return mongoose.Types.ObjectId(String(item._id)); 
				})}}, 
			{}, 
			{
				sort: { 
					'created_date' : -1
				},
				skip: skip,
				limit: 10 
			}, function(err, checkins) {

				assembleResults(checkins);
		});

		function assembleResults(checkins) {
			var result;
			var results = [];
			checkins.forEach(function(item) {
				result = {};
				result.date = item.created_date;
				result.type = "CHECKIN";
				result.data = item;
				results.push(result);
			});

			callback(null, results);
		}
	};

	function getVoucherNotifs(outlets, skip, callback) {
		Voucher.find(
			{'issue_details.issued_at': {
				$in: outlets.map(
					function(item){ 
						return mongoose.Types.ObjectId(String(item._id)); 
				})}}, 
			{}, 
			{
				sort: { 
					'basics.created_at' : -1
				},
				skip: skip,
				limit: 10 
			}).populate('issue_details.issued_to').exec(function(err, vouchers) {

				assembleResults(vouchers);
		});

		function assembleResults(vouchers) {
			var result;
			var results = [];
			vouchers.forEach(function(item) {
				result = {};
				result.date = item.basics.created_at;
				result.type = "VOUCHER";
				result.data = item;
				result.phone = item.issue_details.issued_to.phone;
				results.push(result);
			});

			callback(null, results);
		}
	};

	function getRedeemNotifs(outlets, skip, callback) {
		Voucher.find(
			{'used_details.used_at': {
				$in: outlets.map(
					function(item){ 
						return mongoose.Types.ObjectId(String(item._id)); 
				})}
			},
			{}, 
			{
				sort: { 
					'used_details.used_time' : -1
				},
				skip: skip,
				limit: 10 
			}).populate('used_details.used_by'
			).populate('used_details.used_at'
            ).populate('issue_details.issued_for').exec(function(err, vouchers) {

				assembleResults(vouchers);
		});

		function assembleResults(vouchers) {
			var result;
			var results = [];
			vouchers.forEach(function(item) {
				result = {};
				result.date = item.used_details.used_time;
				result.type = "REDEEM";
				result.data = item;
				if(item.used_details.used_by) {
					result.phone = item.used_details.used_by.phone;
				}
				results.push(result);
			});

			callback(null, results);
		}
	};

	function getFavNotifs(outlets, skip, callback) {
		Favourite.find(
			{outlets: {
				$in: outlets.map(
					function(item){ 
						return mongoose.Types.ObjectId(String(item._id)); 
				})}}, 
			{}, 
			{
				sort: { 
					'created_date' : -1
				},
				skip: skip,
				limit: 10 
			}).populate('account').exec(function(err, favs) {

				assembleResults(favs);
		});

		function assembleResults(favs) {
			var result;
			var results = [];
			favs.forEach(function(item) {
				result = {};
				result.date = item.created_date;
				result.type = "FAVS";
				result.data = item;
				if(item.account && item.account.phone) {
					result.phone = item.account.phone;
					results.push(result);
				}
			});

			callback(null, results);
		}
	};
}