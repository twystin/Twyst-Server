var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator"),
	Utils = require('../../../common/utilities'),
	VoucherGen = require('../../voucher-gen');
var Checkin = mongoose.model('Checkin'),
	Qr = mongoose.model('Qr'),
	Program = mongoose.model('Program'),
	Outlet = mongoose.model('Outlet'),
	Reward = mongoose.model('Reward'),
	Voucher = mongoose.model('Voucher');

module.exports.checkin = function(req, res) {
	var code = req.body.code; 
	if(!code) {
		res.send(400, {	
			'status': 'error',
			'message': 'Error in checkin',
			'info': 'Request body empty'
		});
	}
	else {
		code = code.substr(code.length - 6);
		getQr(code, function (err, qr) {
			if(err) {
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
		if(!req.user.phone) {
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
		else if(isOutletClosed(qr.outlet_id)) {
			res.send(400, {	
				'status': 'error',
				'message': 'Outlet closed currently',
				'info': 'Outlet closed currently'
			});
		}
		else {
			hasActiveRewards(qr.outlet_id, function (err, reward) {
				if(err) {
					res.send(400, {	
						'status': 'error',
						'message': 'Error getting reward',
						'info': err
					});
				}
				else {
					if(!reward) {
						res.send(400, {	
							'status': 'error',
							'message': 'No active rewards currently',
							'info': 'No active rewards currently'
						});
					}
					else {
						processCheckin(qr, reward);
					}
				}
			})
		}
	}

	function processCheckin(qr, reward) {
		isValidCheckin(req.user.phone, qr.outlet_id._id, function (err, data) {
			if(err) {
				res.send(400, {	
					'status': 'error',
					'message': 'Error validating checkin',
					'info': 'Error validating checkin'
				});
			}
			else if(data === 'OTHER_PLACE') {
				res.send(400, {	
					'status': 'error',
					'message': 'Checked-in somewhere else',
					'info': 'Checkin after some time'
				});
			}
			else if(data === 'HERE') {
				res.send(400, {	
					'status': 'error',
					'message': 'Checked-in here recently',
					'info': 'Checkin after some time'
				});
			}
			else {
				countCheckinHere(req.user.phone, reward, function (err, count) {
					if(err) {
						res.send(400, {	
							'status': 'error',
							'message': 'Error getting checkin count',
							'info': 'Error getting checkin count'
						});
					}
					var applicable_reward = getMatchedReward(reward, count);
					if(!applicable_reward) {
						res.send(400, {	
							'status': 'error',
							'message': 'No reward for you',
							'info': 'No reward for you'
						});
					}
					else {
						saveCheckin(qr, req.user, applicable_reward, count, reward);
					}
				});
			}
		})
	}

	function saveCheckin(qr, user, applicable_reward, count, reward) {
		var checkin = {
			phone: user.phone,
			outlet: qr.outlet_id._id,
			checkin_program: reward.program._id,
			checkin_tier: applicable_reward.tier,
			checkin_for: applicable_reward.offer,
			location: (qr.type === 'single') ? 'HOME_DELIVERY' : 'DINE_IN',
			checkin_type: 'QR',
			checkin_code: qr.code
		};
		checkin = new Checkin(checkin);
		checkin.save(function (err) {
			if(err) {
				res.send(400, {	
					'status': 'error',
					'message': 'Error saving checkin',
					'info': err
				});
			}
			else {
				updateQrUsed(qr);
				var success_obj = {
					outlet: qr.outlet_id,
					reward_distance: (applicable_reward.count - 1) - (count + 1),
					reward: applicable_reward
				}
				if(success_obj.reward_distance === 0) {
					saveVoucher(user, success_obj, reward, checkin._id);
					res.send(200, {	
						'status': 'success',
						'message': 'Successfully checked-in, Voucher generated',
						'info': success_obj
					});
				}
				else {
					res.send(200, {	
						'status': 'success',
						'message': 'Successfully checked-in',
						'info': success_obj
					});
				}
			}
		})
	}

	function saveVoucher(user, success_obj, reward, checkin_id) {
		var obj = {
			user: user,
			reward_table: reward,
			current_reward: success_obj.reward,
			checkin_id: checkin_id,
			creation_time: Date.now(),
			is_batch: false
		};
		VoucherGen.generate(obj, function (err, voucher) {
			if(err) {
				console.log(err);
			}
			else {
				console.log('Voucher generated - code: ' + voucher.basics.code);
			}
		});
	}
}

function updateQrUsed(qr) {
	qr.times_used += 1;
	qr.save(function (err) {
		console.log(err || '');
	});
}

function getMatchedReward(reward, count) {
	count = count || 0;
	count += 1;
	for (var i = 0; i < reward.rewards.length; i++) {
        if(reward.rewards[i].count > count) {
	        return reward.rewards[i];
	    }
    };
	return null;
}

function countCheckinHere(phone, reward, cb) {
	Checkin.count({
		phone: phone,
		checkin_program: reward.program
	}, function (err, count) {
		cb(err, count);
	})
}

function hasActiveRewards(outlet, cb) {
	Reward.findOne({
		outlets: outlet._id,
		status: 'active'
	})
	.populate('program').exec(function (err, reward) {
		cb(err, reward);
	})
}

function isValidCheckin(phone, outlet_id, cb) {
	var cap_time_six_hours = new Date(Date.now() -  21600000),
		cap_time_five_minutes = new Date(Date.now() - 300000);
	Checkin.findOne({
		phone: phone,
		created_date: {
			$gt: cap_time_six_hours
		}
	}).sort({
		created_date: -1
	}).exec(function (err, checkin) {
		if(err) {
			cb(err, null);
		}
		else {
			if(!checkin) {
				cb(err, null);
			}
			else {
				if(checkin.outlet.equals(outlet_id)) {
					cb(err, 'HERE');
				}
				else if(checkin.created_date > cap_time_five_minutes) {
					cb(err, 'OTHER_PLACE');
				}
				else {
					cb(err, null);
				}
			}
		}
	})
}

function isOutletClosed(outlet) {
	return Utils.isClosed(outlet.business_hours);
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