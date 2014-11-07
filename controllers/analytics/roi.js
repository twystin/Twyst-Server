'use strict';

var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Outlet = mongoose.model('Outlet'); 

var costs = [100, 300, 500, 1000, 1500, 2000, 2500, 3000, 3500];

module.exports.get = function(req, res){
	Outlet.find({
		'outlet_meta.accounts': req.user._id
	}, function (err, outlets) {
		if(err || !outlets) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		}
		else {
			getVouchers(outlets);
		}
		
	});
	function getVouchers(outlets){
			var d = new Date(Date.now() - 7776000000);
			Voucher.count({
				'basics.status' : 'merchant redeemed',
				'used_details.used_time' : { $gte : d },
				'used_details.used_at' : {
					$in: outlets.map(function (o) {
						return o._id;
					})
				}
			}, function (err, VoucherCount){
				if(err) {
					res.send(400, {
						'status': 'error',
						'message': 'Error getting Voucher Count',
						'info': err
					});
				}
				else if (VoucherCount === 0){
					res.send(200, {
						'status': 'success',
						'message': 'No voucher redemeption in last three months',
						'info': '' 
					})
				}
				else{
					calculateFigure(outlets, VoucherCount);
				}	
			})
		}

		function calculateFigure(outlets, VoucherCount){
			var roi = ((costs[outlets[0].attributes.cost_for_two.min] + costs[outlets[0].attributes.cost_for_two.max]) / 4) * VoucherCount		
			res.send(200, {
				'status': 'success',
				'message': 'Successfully calculated ROI',
				'info': 'ROI for last 3 months is '+ roi,
				'outlet': outlets[0],
				'VoucherCount': VoucherCount
			});		
		}
}