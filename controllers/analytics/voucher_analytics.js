var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Outlet = mongoose.model('Outlet');
var async = require('async');

var _ = require('underscore');


module.exports.getAllVouchers = function (req, res) {
	// 7 days earlier

	var ranges = [];

	for(var i = 7; i >= 0; i--) {
		
		var now = new Date();
		now.setHours(0,0,0,0);
		now.setDate(now.getDate()+1);
		ranges.push(now.setDate(now.getDate()-i));
	}

	Outlet.find({'outlet_meta.accounts': req.user._id}, function (err, outlets) {
		if(err || outlets.length < 1) {
			res.send(400,{
				'status': 'error',
				'message': 'Unable to get voucher analytics',
				'info': JSON.stringify(err)
			});
		}
		else {
			
			getUniqueVouchers(outlets);
		}
	});

	function getUniqueVouchers(outlets) {
		
		async.forEach([1,2,3,4,5,6,7], function(key) {
			
			Voucher.find({
				'issue_details.issued_at': {
        				$in: outlets.map(
        					function(outlet){ 
        						return mongoose.Types.ObjectId(String(outlet._id)); 
        				})},
				'basics.created_at': 
					{ $gt: new Date(ranges[key-1]), 
						$lt: new Date(ranges[key]) }}, 
				function (err, suc) {
					
					if(err) {
						suc = [];
					}
					
					getVoucherCounts(ranges[key-1], suc);

			});
		});
	}

	function getVoucherCounts(low, data) {

		var unique_vouchers = _.uniq(data, function (obj) {
			return obj.phone;
		})

		var unique_count = unique_vouchers.length;
		var total_count = data.length;

		assembleResult(low, total_count, unique_count);
	}

	var voucher_data_all = {
        labels : [],
        datasets : [
            {
                data : []
            }
        ]
	};

	var voucher_data_unique = {
        labels : [],
        datasets : [
            {
                data : []
            }
        ]
	};

	var counter = 0;

	function assembleResult(date, total_count, unique_count) {
		
		voucher_data_all.labels.push(new Date(date));
		voucher_data_all.datasets[0].data.push(total_count);
		voucher_data_unique.labels.push(date);
		voucher_data_unique.datasets[0].data.push(unique_count);

		++counter;

		if(counter === 7) {

			sortResults (voucher_data_all, voucher_data_unique);
		}
	}

	function sortResults (voucher_data_all, voucher_data_unique) {

		voucher_data_all = insertionSort(voucher_data_all);

		voucher_data_unique = insertionSort(voucher_data_unique);

		voucher_data_all = formateDate(voucher_data_all);

		var voucher_data = {};
		voucher_data.voucher_data_all = voucher_data_all;
		voucher_data.voucher_data_unique = voucher_data_unique;

		res.send(200, {
			'status': 'success',
			'message': 'Got voucher analytics',
			'info': JSON.stringify(voucher_data)
		});
	}

	function formateDate (obj) {

		for(var j = 0; j < obj.labels.length; j++) {

			obj.labels[j] = obj.labels[j].toDateString();
		}

		return obj;
	}

	function insertionSort(obj) {

		for(var j = 1; j < obj.labels.length; j++) {
			var key = obj.labels[j];
			var key2 = obj.datasets[0].data[j];
			var i = j - 1;

			while(i >= 0 && obj.labels[i] > key) {
				obj.labels[i+1] = obj.labels[i];
				obj.datasets[0].data[i+1] = obj.datasets[0].data[i];
				i = i - 1;
			}

			obj.labels[i+1] = key;
			obj.datasets[0].data[i+1] = key2;
		}

		return obj;
	}
}

module.exports.getAllVoucherCount = function (req, res) { 

	Outlet.find({'outlet_meta.accounts': req.user._id}, function (err, outlets) {
		if(err || outlets.length < 1) {
			res.send(400,{
				'status': 'error',
				'message': 'Unable to get voucher analytics',
				'info': JSON.stringify(err)
			});
		}
		else {
			
			getTotalVouchers(outlets);
		}
	});

	function getTotalVouchers(outlets) {

		Voucher.count({
			'issue_details.issued_at': {
    				$in: outlets.map(
    					function(outlet){ 
    						return mongoose.Types.ObjectId(String(outlet._id)); 
    				})}, 'basics.status': {$ne: 'active'}}, function (err, count) {
				
				if(err) {
					res.send(400,{
						'status': 'error',
						'message': 'Unable to get voucher count',
						'info': JSON.stringify(err)
					});
				}
				else {
					res.send(200,{
						'status': 'success',
						'message': 'Got voucher count successfully',
						'info': JSON.stringify(count)
					});
				}
		});
	}
}