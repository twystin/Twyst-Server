var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator"),
	Utils = require('../../../common/utilities'),
	CorporateCheckin = require('./corporateCheckin')
	CommonUtilities = require('../../../common/utilities');
var Checkin = mongoose.model('Checkin'),
	Qr = mongoose.model('Qr'),
	Program = mongoose.model('Program'),
	Outlet = mongoose.model('Outlet'),
	Reward = mongoose.model('Reward'),
	Voucher = mongoose.model('Voucher')
	Winback = mongoose.model('Winback'),
	Corporate = mongoose.model('Corporate');


module.exports.checkin = function(user, code, res, callback) { 
	if(!code) {
		res.send(400, {	
			'status': 'error',
			'message': 'Error in checkin',
			'info': 'Request body empty'
		});
	}
	else {
		
		getQr(code, function (err, qr) {
			if(err) {
				console.log(err);
				res.send(400, {	
					'status': 'error',
					'message': 'Error getting qr code',
					'info': err
				});
			}
			else {
				if(!qr) {
					res.send(400, {	
						'status': 'error',
						'message': 'Invalid qr code',
						'info': 'Invalid qr code'
					});
				}
				else {
					initCheckin(qr);
				}
			}
		})	
	}

	function initCheckin(qr) {
		if(!user.phone) {
			res.send(400, {	
				'status': 'error',
				'message': 'Phone number not found',
				'info': 'Phone number required to checkin'
			});
		}
		else if(isExpired(qr)) {
			res.send(400, {	
				'status': 'error',
				'message': 'Expired QR code',
				'info': 'Expired QR code'
			});
		}
		else if(isUsedTooMany(qr)) {
			res.send(400, {	
				'status': 'error',
				'message': 'Used QR code',
				'info': 'Used QR code'
			});
		}
		else if(!qr.outlet_id || (qr.outlet_id.outlet_meta.status !== 'active')) {
			res.send(400, {	
				'status': 'error',
				'message': 'Invalid QR code',
				'info': 'Invalid QR code'
			});
		}
		
		else {
			getWinbacks(qr.outlet_id._id, function (err, winback) {
				console.log(err);
				if(err) {
					res.send(400, {	
						'status': 'error',
						'message': 'Error getting reward',
						'info': err
					});
				}
				else {
					if(!winback) {
						res.send(400, {	
							'status': 'error',
							'message': 'No active rewards currently',
							'info': 'No active rewards currently'
						});
					}
					else {
						saveVoucher(user, winback, function (err, voucher) {
							if(err) {
								callback(err);
							}
							else {
								var success_obj = {
									outlet: qr.outlet_id,
									reward: voucher
								}
								saveCorporateData(user, winback, voucher, function(err, data) {
									if(err) console.log(err);
									updateQrUsed(qr);
									res.send(200, {	
										'status': 'success',
										'message': 'Successfully checked-in, Voucher generated',
										'info': success_obj
									});
								});
								
							}
						});
					}
				}
			})
		}
	}
}

function saveVoucher(user, winback, cb) {
	var voucher = getVoucherObject(winback, user);
	voucher = new Voucher(voucher);		
	voucher.save(function (err) {
		cb(err, voucher);
	})
	
}

// Generate the voucher object for the winback.
function getVoucherObject(winback, user) {
	var reward = CommonUtilities.rewardify(winback);
	var voucher = {
		basics: {
			code: keygen._({
				forceUppercase: true,
				length: 6,
				exclude:['O', '0', 'L', '1']
			}),
			type: 'WINBACK',
			description: reward,
			isCorporate: true
		},
		validity: {
			start_date: new Date(),
			end_date: Date.now() + winback.validity.voucher_valid_days * 86400000,
			number_of_days: winback.validity.voucher_valid_days
		},
		issue_details: {
			winback: winback._id,
			issued_at: winback.outlets.map(function (o) {
				return o;
			}),
			issued_to: user._id
		},
		terms: winback.terms
	}
	voucher.validity.end_date = new Date(voucher.validity.end_date);
	//voucher.validity.end_date = helper.setHMS(voucher.validity.end_date, 23, 59, 59);
	return voucher;
}


function getWinbacks(outlet, cb) {
  Winback.findOne({
	  'status': 'active', 
	  'outlets': {
	  	$in: [outlet]
	  }
    })
    .exec(function(err, winback) {
    	if(err) console.log(err);
      	cb(err, winback);
    })
}

function updateQrUsed(qr) {
	qr.times_used += 1;
	delete qr.__v;
	qr.save(function (err) {
		console.log(err || '');
	});
}

function saveCorporateData(user, winback, voucher, callback) {
	var corporateData = {
		outlet: winback.outlets.map(function (o) {
			return o;
		}),
		winback: winback._id,
		account: user._id,
		company_name: 'google',
		voucher: voucher._id,
		created_at: new Date(),
		modified_date: new Date()
	}
	corporateData = new Corporate(corporateData);
	corporateData.save(function(err, data){
		if(err) console.log(err)
		callback(err, data)
	})
}

function isUsedTooMany(qr) {
	if(qr.times_used <= qr.max_use_limit) {
		return false;
	}
	return true;
}

function isExpired(qr) { 
	if(new Date(qr.validity.start) < new Date() 
		&& new Date(qr.validity.end) > new Date()) {
		return false;
	}
	return true;
}

function getQr(code, cb) {
	Qr.findOne({
		code: code
	}).populate('outlet_id').exec(function (err, qr) {
		cb(err, qr);
	})
}

module.exports.autoCheckin = function(_obj, cb) {
	if(!_obj.user.phone || !_obj.outlet) {
		error = {
			'message': 'Missing Phone Number or Outlet ID',
			'info': null
		}
		cb(error);
	}
	else {
		getWinbacks(_obj.outlet, function (err, winback) {
			console.log(err);
			if(err) {
				cb(err);
			}
			else {
				if(!winback) {
					cb('err')
				}
				else if(_obj.user_redeem === 'active') {
					saveVoucher(_obj.user, winback, function (err, voucher) {
						if(err) {
							callback(err);
						}
						else {
							saveCorporateData(_obj.user, winback, voucher, function(err, data) {
								if(err) console.log(err);
								cb(voucher);
							});
							
						}
					});
				}
				else{
					cb(null);
				}
			}
		})
	};

}