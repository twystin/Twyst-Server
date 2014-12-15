var mongoose = require('mongoose'),
	_ = require('underscore'),
	CommonUtilities = require('../common/utilities'),
	Reward = require('../models/reward_applicability'),
	AutoCheckin = require('./checkins/auto_checkin'),
	SMS = require('../common/smsSender');

var Voucher = mongoose.model('Voucher'),
	Outlet = mongoose.model('Outlet');

module.exports.redeemPanel = function (req, res) {
	var code = req.body.code,
		used_at = req.body.used_at,
		used_time = req.body.used_time || new Date();

	if(code && used_at) {
		initRedeem();
	}
	else {
		res.send(400, { 
			'status': 'error',
            'message': 'Request has missing values',
            'info': 'Request has missing values'
        });
	}

	function initRedeem() {
		var q = {
			'basics.code': code,
			'issue_details.issued_at': used_at
		};

		getVoucher(q, function (err, voucher) {
			if(err) {
				res.send(400, { 
					'status': 'error',
		            'message': 'Error getting voucher',
		            'info': err
		        });
			}
			else {
				if(!voucher) {
					res.send(400, { 
						'status': 'error',
			            'message': 'Invalid voucher code',
			            'info': 'Invalid voucher code'
			        });
				}
				else {
					processRedeem(voucher);
				}
			}
		});
	}

	function processRedeem(voucher) {
		if (voucher.basics.type === 'WINBACK') {
			redeemWinback(voucher);
		}
		else if (!voucher.basics.type || voucher.basics.type === 'CHECKIN') {
			redeemCheckin(voucher);
		}
		else {
			res.send(400, { 
				'status': 'error',
	            'message': 'Invalid voucher code',
	            'info': 'Invalid voucher code'
	        });
		}
	}

	function redeemWinback(voucher) {
		if(isExpired(voucher.validity.start_date, voucher.validity.end_date)) {
			res.send(400, { 
				'status': 'error',
	            'message': 'Expired voucher code',
	            'info': 'Expired voucher code'
	        });
		}
		else {
			redeemVoucher(voucher, used_at, used_time, function (err) {
				if(err) {
					res.send(400, { 
						'status': 'error',
			            'message': 'Error redeeming voucher',
			            'info': err
			        });
				}
				else {
					var user = voucher.issue_details.issued_to;
	                if(user && user.phone) {
	                	sendRedeemSmsToUser(voucher, user, used_at, used_time);
	                }
	                res.send(200, { 
						'status': 'success',
			            'message': 'Successfully redeemed voucher',
			            'info': 'Successfully redeemed voucher'
			        });
				}
			})
		}
	}

	function redeemCheckin(voucher) {
		var program = voucher.issue_details.program;
		if(isExpired(program.validity.burn_start, program.validity.burn_end)) {
			res.send(400, { 
				'status': 'error',
	            'message': 'Expired voucher code',
	            'info': 'Expired voucher code'
	        });
		}
		else {
			redeemVoucher(voucher, used_at, used_time, function (err) {
				if(err) {
					res.send(400, { 
						'status': 'error',
			            'message': 'Error redeeming voucher',
			            'info': err
			        });
				}
				else {
					var user = voucher.issue_details.issued_to;
	                if(user && user.phone) {
	                	sendRedeemSmsToUser(voucher, user, used_at, used_time);
	                }
	                res.send(200, { 
						'status': 'success',
			            'message': 'Successfully redeemed voucher',
			            'info': 'Successfully redeemed voucher'
			        });
				}
			})
		}
	}
}

function sendRedeemSmsToUser (voucher, user, used_at, used_time) {
	var auto_checkin_obj = {
        'outlet': used_at,
        'location': 'DINE_IN',
        'phone': user.phone
    };
	AutoCheckin.autoCheckin(auto_checkin_obj);
    var date = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    Outlet.findOne({
    	_id: used_at
    }, function (err, outlet) {
    	if(outlet) {
    		var message = 'Voucher code '+ voucher.basics.code +' redeemed at '+ outlet.basics.name +' on '+ CommonUtilities.formatDate(new Date(used_time)) +' at '+ date.getHours() + ':' + date.getMinutes() +'. Keep checking-in at '+ outlet.basics.name +' on Twyst for more rewards! Get Twyst http://twy.st/app';
    		SMS.sendSms(user.phone, message, 'VOUCHER_REDEEM_MESSAGE');
    	}
    });
}

function redeemVoucher(voucher, used_at, used_time, cb) {
	voucher.basics.status = 'merchant redeemed';
	voucher.basics.type = voucher.basics.type || 'CHECKIN';
	voucher.used_details.used_at = used_at;
	voucher.used_details.used_by = voucher.issue_details.issued_to;
	voucher.used_details.used_time = CommonUtilities.setCurrentTime(used_time);
	voucher.used_details.used_date = Date.now();
	voucher.save(function (err) {
		cb(err);
	})
}

function isExpired(start, end) {
	if(new Date(start) <= new Date() && new Date(end) >= new Date()) {
		return false;
	}
	return true;
}

function getVoucher(q, cb) {
	Voucher.findOne(q)
    .populate('issue_details.winback')
    .populate('issue_details.program')
    .populate('issue_details.issued_to')
    .exec(function(err,voucher) {
    	cb(err, voucher);
    });
}