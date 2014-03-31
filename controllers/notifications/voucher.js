var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Voucher = mongoose.model('Voucher');
var _ = require('underscore');

module.exports.getVoucherNotify = function(req,res) {
	
	Outlet.find({'outlet_meta.accounts': req.user._id}, function(err,outlets) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting outlets',
						'info': JSON.stringify(err)
			});
		} else {
			if(outlets.length === 0) {
				res.send(200, {	'status': 'success',
							'message': 'You have no outlets',
							'info': ''
				});
			}
			else {
				getVoucherRedeemHistory(outlets);
			}
		}
	});

	function getVoucherRedeemHistory (outlets) {
		Voucher.find({'used_details.used_at':{$in: outlets.map(
                            function(obj){
                                return mongoose.Types.ObjectId(String(obj._id)); 
                        })
                    }, 'basics.status': 'user redeemed'}).sort({'used_details.used_time': -1}).populate('used_details.used_by'
                    ).populate('used_details.used_at'
                    ).populate('issue_details.issued_for').exec(
                    function (err, doc) {
                    	if(err) {
                    		res.send(400, {	'status': 'error',
										'message': 'Error getting notification',
										'info': JSON.stringify(err)
							});
                    	}
                    	else {
                    		res.send(200, {	'status': 'success',
										'message': 'Got notification successfully',
										'info': JSON.stringify(doc)
							});
                    	}
                    })
	}
};