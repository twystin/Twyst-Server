var _ = require('underscore'),
	mongoose = require('mongoose');
var Helper = require('./helper'),
	VoucherGen = require('../../voucher-gen'),
	Utils = require('../../../common/utilities');

var Checkin = mongoose.model('Checkin'),
	Voucher = mongoose.model('Voucher');

// Checkin Module
// Parameter as checkin object and callback
// object properties
// phone, outlet, location, created_date, checkin_type, checkin_code

module.exports.checkin = function (_obj, cb) {
	var error = null,
		success = null;
	if(!_obj.phone || !_obj.outlet) {
		error = {
			'message': 'Missing Phone Number or Outlet ID',
			'info': null
		}
		cb(error);
	}
	else {
		if(isValidPhone(_obj.phone)) {
			_obj.location = _obj.location || 'HOME_DELIVERY';
			_obj.created_date = Utils.setCurrentTime(_obj.created_date);
			_obj.checkin_type = _obj.checkin_type || 'PANEL';
			_obj.checkin_code = _obj.checkin_code || 'PANEL';
			preprocessUser();
		}
		else {
			error = {
				'message': 'Invalid mobile number. Please check the number you have entered.',
				'info': null
			}
			cb(error);
		}
	};

	function preprocessUser() {
		Helper.isUserRegistered(_obj.phone, function (err, status) {
			if(err) {
				error = {
					'message': 'Error getting registered User',
					'info': err
				}
				cb(error);
			}
			else {
				if(status) {
					_obj.user = status;
					validateCheckin();
				}
				else {
					Helper.registerUser(_obj.phone, function (err, user) {
						if(err) {
							error = {
								'message': 'Error registering User',
								'info': err
							}
							cb(error);
						}
						else {
							if(user) {
								_obj.user = user;
								validateCheckin();
							}
							else {
								error = {
									'message': 'Error getting registered User',
									'info': null
								}
								cb(error);
							}
						}
					})
				}
			}
		})
	}

	function validateCheckin() {
		Helper.otherCheckinToday(_obj.phone, _obj.created_date, function (err, checkin) {
			if(err) {
				error = {
					'message': 'Error getting last checkin',
					'info': err
				}
				cb(error);
			} 
			else {
				if(!checkin) {
					initCheckin();
				}
				else {
					var checkin_place = Helper.getCheckinInfo(checkin, _obj.outlet);
					if(checkin_place === 'HERE') {
						error = {
							'message': 'Check-in error. User has been checked-in already. Please check-in again on his next visit / order.',
							'info': null
						}
						cb(error);
					}
					else if (checkin_place === 'SOMEWHERE_ELSE'){
						error = {
							'message': 'Check-in error. User checked-in recently somewhere else. Please try checking-in here after some time.',
							'info': null
						}
					}
					else {
						initCheckin();
					}
				}
			}
		});
	}

	function initCheckin() {
		Helper.hasActiveRewards(_obj.outlet, function (err, reward) {
			if(err) {
				error = {
					'message': 'Check-in error. No active rewards here',
					'info': err
				}
				cb(error);
			}
			else {
				if(!reward) {
					error = {
						'message': 'Check-in error. No active rewards here',
						'info': null
					}
					cb(error);
				}
				else {
					_obj.reward = reward;
					processCheckin();
				}
			}
		});
	}

	function processCheckin() {
		Helper.countCheckinHere(_obj.phone, _obj.reward.program, function (err, count) {
			if(err) {
				error = {
					'message': 'Check-in error. Error getting checkin count',
					'info': err
				}
				cb(error);
			}
			else {
				_obj.count = count;
				var applicable_reward = Helper.getMatchedReward(_obj.reward, _obj.count);
				if(!applicable_reward) {
					error = {
						'message': 'Check-in error. No active rerards for this user',
						'info': null
					}
					cb(error);
				}
				else {
					_obj.current_reward = applicable_reward;
					saveCheckin();
				}
			}
		});
	}

	function saveCheckin() {
		var checkin = Helper.getCheckinObject(_obj);
		checkin = new Checkin(checkin);
		checkin.save(function (err) {
			if(err) {
				console.log(err)
				error = {
					'message': 'Check-in error. Error saving checkin',
					'info': err
				}
				cb(error);
			}
			else {
				_obj.reward_distance = (_obj.current_reward.count - 1) - (_obj.count + 1);
				if(_obj.reward_distance === 0) {
					saveVoucher(checkin);
				}
				else {
					success = {
						'message': _obj.phone + ' has been checked-in successfully',
						'info': _obj
					}
					cb(null, success);
				}
			}
		});
	}

	function saveVoucher(checkin) {
		var obj = {
			user: _obj.user,
			reward_table: _obj.reward,
			current_reward: _obj.current_reward,
			checkin_id: checkin._id,
			creation_time: new Date(checkin.created_date).getTime(),
			is_batch: _obj.is_batch,
			gen_type: _obj.checkin_type
		};
		VoucherGen.generate(obj, function (err, voucher) {
			if(err) {
				console.log(err);
				success = {
					'message': _obj.phone + ' has been checked-in successfully',
					'info': _obj
				}
				cb(null, success);
			}
			else {
				if(!voucher) {
					success = {
						'message': _obj.phone + ' has been checked-in successfully',
						'info': _obj
					}
					cb(null, success);
				}
				else {
					_obj.voucher = voucher;
					success = {
						'message': _obj.phone + ' has been checked-in successfully, User also unlocked a voucher',
						'info': _obj
					}
					cb(null, success);
					console.log('Voucher generated - code: ' + voucher.basics.code);
				}
			}
		});
	}
}

function isValidPhone(phone) {
	if(phone) {
		var last_ten_char = phone.substr(phone.length - 10);
		if(isNumber(last_ten_char)
			&& isValidFirstDigit(last_ten_char)) {
			return true;
		}
	}
	return false;
}

function isValidFirstDigit(str) {
	if(str[0] == '7' 
		|| str[0] == '8'
		|| str[0] == '9') {
		return true;
	}
	return false;
}

function isNumber(str) {
    var numeric = /^-?[0-9]+$/;
    return numeric.test(str);
}