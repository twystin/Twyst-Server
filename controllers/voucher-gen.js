var mongoose = require('mongoose'),
	_ = require('underscore'),
	keygen = require("keygenerator");

var Voucher = mongoose.model('Voucher'),
	Offer = mongoose.model('Offer');

// Common Function to generate Vouchers
// Parameter(object) with properties: 
// 1. User Object
// 2. Reward Table
// 3. Current Reward (Applicable reward)
// 4. Checkin which generated this reward
// 5. Checkin Type(isBatch)... true/false
module.exports.generate = function (object_param, cb) {
	getOffer(object_param.current_reward.offer, function (err, offer) {
		if(!offer) {
			// Do nothing... Return the callback with error
			cb(err);
		}
		else {
			if(!offer) {
				// Do nothing... Return the callback
				cb();
			}
			else {
				object_param.offer = offer;
				var voucher = getVoucherObject(object_param);
				saveVoucher(voucher, function (err) {
					cb(err, voucher);
				})
			}
		}
	});
}

function getVoucherObject(object_param) {
	var end_date;
	if(object_param.offer.voucher_valid_for_days !== undefined) {
		var burn_date = new Date();
		burn_date.setDate(burn_date.getDate() + object_param.offer.voucher_valid_for_days);
		end_date = burn_date;
	}
	else {
		var burn_date = new Date();
		burn_date.setDate(burn_date.getDate() + 35);
		end_date = burn_date;
	}
	var voucher = {};
	voucher = {
		basics: {
			code: keygen._({
				forceUppercase: true, 
				length: 6, 
				exclude:['O', '0', 'L', '1']
			}),
			description: object_param.current_reward.rewardified,
			type: 'CHECKIN',
			status: 'active',
			created_at: object_param.is_batch ? (new Date(object_param.creation_time)) : (new Date(object_param.creation_time).getTime() + 10800000),
			gen_type: object_param.gen_type
		},
		reward: object_param.offer.reward,
		applicable_hours: getTimings(object_param.offer),
		terms: object_param.offer.terms,
		validity: {
			start_date: new Date(),
			end_date: end_date,
			number_of_days: object_param.offer.voucher_valid_for_days || 35
		},
		issue_details: {
			issued_to: object_param.user._id,
			program: object_param.reward_table.program._id,
			tier: object_param.current_reward.tier,
			issued_for: object_param.offer._id,
			issued_at: object_param.reward_table.program.outlets
		},
		checkin_details: {
			checkin_id: object_param.checkin_id,
			batch: object_param.is_batch
		}
	};
	return voucher;
}

function saveVoucher(voucher, cb) {
	voucher = new Voucher(voucher);
	voucher.save(function (err) {
		cb(err);
	});
}

function getOffer(offer_id, cb) {
	Offer.findOne({
		_id: offer_id
	})
	.exec(function (err, offer) {
		cb(err, offer);
	})
}

function getTimings(offer) {
	var _hours = {
	    sunday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    },
	    monday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    },
	    tuesday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    },
	    wednesday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    },
	    thursday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    },
	    friday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    },
	    saturday: {
	        closed: {type: Boolean, default: false},
	        timings: []
	    }
	}
	var days = ['monday' ,'tuesday' ,'wednesday' ,'thursday' ,'friday', 'saturday', 'sunday']
	if(!offer.avail_hours) {
		return _hours;
	}
	else {
		days.forEach(function (d) {
			_hours[d].closed = offer.avail_hours[d].closed;
			offer.avail_hours[d].timings.forEach(function (t) {
				var open_close_timings = {
					open: t.open,
					close: t.close
				};
				_hours[d].timings.push(open_close_timings);
			});
		});
	}
	return _hours;
}