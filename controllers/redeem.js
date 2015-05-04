var mongoose = require('mongoose'),
	_ = require('underscore'),
	Utils = require('../common/utilities'),
	Reward = require('../models/reward_applicability'),
	AutoCheckin = require('./checkins/panel/request'),
	SMS = require('../common/smsSender');

var Voucher = mongoose.model('Voucher'),
	Outlet = mongoose.model('Outlet');

module.exports.redeemPanel = function (req, res) {
	var code = req.body.code,
		used_at = req.body.used_at,
		used_time = req.body.used_time || new Date()
		phone = req.body.phone;

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
				console.log(err)
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
			redeemWinbackVoucher(voucher);
		}
		else if (!voucher.basics.type || voucher.basics.type === 'CHECKIN') {
			redeemCheckinVoucher(voucher);
		}
		else if(!voucher.basics.type || voucher.basics.type === 'DEAL'){
			redeemWinbackVoucher(voucher);
		}
		else {
			res.send(400, { 
				'status': 'error',
	            'message': 'Invalid voucher code',
	            'info': 'Invalid voucher code'
	        });
		}
	}

	function redeemWinbackVoucher(voucher) {
		if(isExpired(voucher.validity.start_date, voucher.validity.end_date)) {
			res.send(400, { 
				'status': 'error',
	            'message': 'Expired voucher code',
	            'info': 'Expired voucher code'
	        });
		}
		else {
			var status = "merchant redeemed";
			redeemVoucher(voucher, used_at, used_time, status, function (err) {
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

	function redeemCheckinVoucher(voucher) {
		var program = voucher.issue_details.program;
		if(isExpired(voucher.validity.start_date, voucher.validity.end_date)) {
			res.send(400, { 
				'status': 'error',
	            'message': 'Expired voucher code',
	            'info': 'Expired voucher code'
	        });
		}
		else {
			var status = 'merchant redeemed';
			redeemVoucher(voucher, used_at, used_time, status, function (err) {
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
	AutoCheckin.autoCheckin(auto_checkin_obj, function (result) {
		
	});
    var date = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    Outlet.findOne({
    	_id: used_at
    }, function (err, outlet) {
    	if(outlet) {
    		var message = 'Voucher code '+ voucher.basics.code +' redeemed at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(used_time)) +' at '+ date.getHours() + ':' + date.getMinutes() +'. Keep checking-in at '+ outlet.basics.name +' on Twyst for more rewards! Get Twyst http://twy.st/app';
    		SMS.sendSms(user.phone, message, 'VOUCHER_REDEEM_MESSAGE', 'TWYSTR', outlet._id);
    	}
    });
}

function redeemVoucher(voucher, used_at, used_time, status, cb) {
	voucher.basics.status = status;
	voucher.basics.type = voucher.basics.type || 'CHECKIN';
	voucher.used_details.used_at = used_at;
	voucher.used_details.used_by = voucher.issue_details.issued_to;
	voucher.used_details.used_time = Utils.setCurrentTime(used_time);
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

function getOutlet(q, cb) {
	Outlet.findOne(q, function (err, outlet) {
		cb(err, outlet);
	})
}


module.exports.redeemApp = function (req, res) {
	var code = req.body.code,
		used_at = req.body.used_at,
		used_time = new Date(),
		user = req.user;

	if(code && used_at) {
		getOutlet({
			_id: used_at
		}, function (err, outlet) {
			if(err) {
				res.send(400, { 
					'status': 'error',
		            'message': 'Error getting outlet',
		            'info': err
		        });
			}
			else {
				if(!outlet) {
					res.send(400, { 
						'status': 'error',
			            'message': 'Error getting outlet',
			            'info': 'Invalid outlet'
			        });
				}
				else {
					if(Utils.isClosed(outlet.business_hours)) {
						res.send(400, { 
							'status': 'error',
				            'message': 'Voucher not available right now',
				            'info': 'Invalid timing for redeem'
				        });
					}
					else {
						initRedeem(outlet);
					}
				}
			}
		})
	}
	else {
		res.send(400, { 
			'status': 'error',
            'message': 'Request has missing values',
            'info': 'Request has missing values'
        });
	}

	function initRedeem(outlet) {
		var q = {
			'basics.code': code,
			'basics.status': 'active',
			'issue_details.issued_at': used_at,
			'issue_details.issued_to': req.user._id
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
					processRedeem(voucher, outlet);
				}
			}
		});
	}

	function processRedeem(voucher, outlet) {
		if(isExpired(voucher.validity.start_date, voucher.validity.end_date)) {
			res.send(400, { 
				'status': 'error',
	            'message': 'Expired voucher code',
	            'info': 'Expired voucher code'
	        });
		}
		else {
			var status = 'user redeemed';
			redeemVoucher(voucher, used_at, used_time, status, function (err) {
				if(err) {
					res.send(400, { 
						'status': 'error',
			            'message': 'Error redeeming voucher',
			            'info': err
			        });
				}
				else {
	                res.send(200, {
						'status': 'success',
			            'message': 'Successfully redeemed voucher',
			            'info': 'Successfully redeemed voucher'
			        });
			        sendMessageToMerchant(voucher, outlet, user.phone);
				}
			})
		}
	}

	function sendMessageToMerchant(voucher, outlet, user_phone) {
		var current_time = new Date();
		var push_message = 'User '+user_phone+' has redeemed voucher '+voucher.basics.code+' on '+Utils.formatDate(current_time)+', at '+outlet.basics.name+', '+outlet.contact.location.locality_1.toString()+'. Voucher is VALID. Reward details- '+voucher.basics.description+'.';
        outlet.contact.phones.reg_mobile.forEach (function (phone) {
            if(phone && phone.num) {
            	SMS.sendSms(phone.num, push_message, 'VOUCHER_REDEEM_MERCHANT_MESSAGE', 'TWYSTR', outlet._id);
            }
        });
	}
}