var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator"),
	Utils = require('../../../common/utilities');
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
					reward_distance: applicable_reward.count - (count + 1),
					reward: null
				}
				if(success_obj.reward_distance === 0) {
					success_obj.reward = applicable_reward;
					saveVoucher(user, success_obj, reward, checkin._id);
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
		var voucher = {};
		voucher.issue_details = {};
		voucher.basics = {};
		voucher.validity = {};
		voucher.checkin_details = {};
		
		//Validity for voucher
		voucher.validity.start_date = reward.program.validity.burn_start;
		voucher.validity.end_date = reward.program.validity.burn_end;
		
		// Issue details
		voucher.issue_details.issued_at = [];
		if(reward.program.outlets.length > 0) {
			voucher.issue_details.issued_at = reward.program.outlets.slice();
		}
		voucher.issue_details.issued_to = user._id;
		voucher.issue_details.program = reward.program._id;
		voucher.issue_details.tier = success_obj.reward.tier;
		voucher.issue_details.issued_for = success_obj.reward.offer;
		voucher.checkin_details.checkin_id = checkin_id;

		if(reward.basics && reward.basics.description) {
			voucher.basics.description = success_obj.reward.rewardified;
		}
		
		voucher.basics.code = keygen._({
			forceUppercase: true, 
			length: 6, 
			exclude:['O', '0', 'L', '1']
		});
		voucher = new Voucher(voucher);

		voucher.save(function (err) {
			if(err) {
				res.send(200, {	
					'status': 'success',
					'message': 'Successfully checked-in, voucher gen error',
					'info': success_obj
				});
			}
			else {
				res.send(200, {	
					'status': 'success',
					'message': 'Successfully checked-in, Unlocked a voucher',
					'info': success_obj
				});
			}
		})
	}
}

function updateQrUsed(qr) {
	qr.times_used += 1;
	qr.save(function (err) {
		console.log(err);
	});
}

function getMatchedReward(reward, count) {
	count = count || 0;
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
	var cap_time_six_hours = new Date(Date.now() -  10 * 1000),
		cap_time_five_minutes = new Date(Date.now() - 10 * 1000);
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
	return Utils.isOpen(outlet.business_hours);
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