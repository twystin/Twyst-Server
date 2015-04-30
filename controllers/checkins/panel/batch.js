var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator"),
	Helper = require('./helper'),
	Utils = require('../../../common/utilities'), 
	SMS = require('../../../common/smsSender');
var Checkin = mongoose.model('Checkin'),
	Reward = mongoose.model('Reward'),
	Voucher = mongoose.model('Voucher');

module.exports.checkin = function(req, res) {
	var phone = req.body.phone,
		outlet_id = req.body.outlet,
		user = null,
		message = req.body.message,
		location = req.body.location,
		sms_sender_id = req.body.sms_sender_id; 
	if(!phone || !outlet_id || !message) {
		res.send(400, {	
			'status': 'error',
			'message': 'Error in checkin',
			'info': 'Request body empty'
		});
	}
	else {
		Helper.isUserRegistered({
			phone: phone
		}, function (data) {
			if(data) {
				hasBatchCheckin(phone, outlet_id, function (err, status) {
					if(err) {
						res.send(400, {	
							'status': 'error',
							'message': 'Error serving batch',
							'info': err
						});	
					}
					else if(status) {
						res.send(400, {	
							'status': 'error',
							'message': 'Batched recently',
							'info': 'Batched recently'
						});
					}
					else {
						user = data;
						initCheckin();
					}
				})
			}
			else {
				res.send(400, {	
					'status': 'error',
					'message': 'Error registering user',
					'info': 'Error registering user'
				});
			}
		});
	}

	function initCheckin() {
		hasActiveRewards(outlet_id, function (err, reward) {
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
					processCheckin(reward);
				}
			}
		})
	}

	function processCheckin(reward) {
		countCheckinHere(phone, reward, function (err, count) {
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
				saveCheckin(phone, applicable_reward, count, reward);
			}
		});
	}

	function saveCheckin(phone, applicable_reward, count, reward) {
		var checkin = {
			phone: phone,
			outlet: outlet_id,
			checkin_program: reward.program._id,
			checkin_tier: applicable_reward.tier,
			checkin_for: applicable_reward.offer,
			location: location,
			checkin_type: 'BATCH',
			checkin_code: 'BATCH'
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
				var success_obj = {
					outlet: outlet_id,
					reward_distance: (applicable_reward.count - 1) - (count + 1),
					reward: applicable_reward
				}
				if(success_obj.reward_distance === 0) {
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
		var end_date;
		if(success_obj.reward.offer.voucher_valid_for_days !== undefined) {
			var burn_date = new Date();
			burn_date.setDate(burn_date.getDate() + object_param.offer.voucher_valid_for_days);
			end_date = burn_date;
		}
		else {
			end_date = success_obj.program.validity.burn_end;
		}
		voucher.validity.start_date =  new Date();
		voucher.validity.end_date = end_date;
		
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
		voucher.checkin_details.batch = true;

		voucher.basics.description = success_obj.reward.rewardified;
		
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
				var push_message = message.replace(/xxxxxx/g, voucher.basics.code);
				SMS.sendSms(phone, push_message, 'BATCH_CHECKIN', sms_sender_id, outlet_id);
				res.send(200, {	
					'status': 'success',
					'message': 'Successfully checked-in, Unlocked a voucher',
					'info': success_obj
				});
			}
		})
	}
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

function hasActiveRewards(outlet_id, cb) {
	Reward.findOne({
		outlets: outlet_id,
		status: 'active'
	})
	.populate('program').exec(function (err, reward) {
		cb(err, reward);
	})
}

function hasBatchCheckin(phone, outlet_id, cb) {
	Checkin.findOne({
		phone: phone,
		checkin_type: 'BATCH',
		outlet: outlet_id,
		created_date: {
			$gt: new Date(Date.now() - 21600000)
		}
	}).exec(function (err, checkin) {
		if(err) {
			cb(err, checkin);
		}
		else if(checkin) {
			cb(null, true);
		}
		else {
			cb(null, false);
		}
	})
}