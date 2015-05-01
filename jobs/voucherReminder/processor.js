var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Voucher = mongoose.model('Voucher');
var VR = mongoose.model('VoucherReminder');
var Transport = require('./transport');

module.exports.processReminders = function () {
	getReminders(function (err, reminders) {
		if(err) {
			console.log("Error getting reminders: " + new Date());
		}
		else {
			if(!reminders && !reminders.length) {
				console.log("No reminders to send: " + new Date());
			}
			else {
				console.log(reminders.length)
				reminders.forEach(function (r) {
					populateInfo(r, function (err, info) {
						if(err) {
							saveReminderState(r.vouchers, -1, "ERROR GETTING INFO");
						}
						else {
							if(!info) {
								saveReminderState(r.vouchers, -1, "INFO NULL");
							}
							else {
								saveReminderState(r.vouchers, 2, "SENT REMINDER");
								Transport.handleReminder(info);
							}
						}
					})
				})
			}
		}
	})
}

function populateInfo(obj, cb) {
	Account.findOne({
		_id: obj._id
	}, function (err, user) {
		if(err) {
			cb(err, null);
		}
		else {
			if(user && !user.blacklisted) {
				getVouchers(obj.vouchers, function (err, vouchers) {
					if(err) {
						cb(err, null);
					}
					else {
						if(!vouchers || !vouchers.length) {
							cb(err, null);
						}
						else {
							var info = {
								user: user,
								vouchers: vouchers
							};
							cb(null, info);
						}
					}
				})
			}
			else {
				cb(err, null);
			}
		}
	})
}

function getVouchers(vouchers, cb) {
	Voucher.find({
		_id: {
			$in: vouchers
		}
	})
	.populate('issue_details.issued_at')
	.populate('issue_details.issued_for')
	.exec(function (err, vouchers) {
		cb(err, vouchers);
	})
}

function getReminders(cb) {
	VR.aggregate({
		$match: {
			is_processed_today: false,
			timeline: {
				$elemMatch: {
					type: 1,
					at: {
						$gt: new Date(Date.now() - 10 * 60 * 1000),
						$lt: new Date()
					}
				}
			}
		}
	},{
		$group: {
			_id: '$user',
			vouchers: {
				$push: '$voucher'
			}
		}
	}, function (err, op) {
		cb(err, op);
	})
}

function saveReminderState(vouchers, state, message) {
	var status = {
		type: state,
		at: new Date(),
		message: message
	};

	vouchers.forEach(function (voucher) {
		VR.findOne({
			voucher: voucher
		}, function (err, vr) {
			if(err) {
				console.log("Error getting reminder");
			}
			else {
				if(!vr) {
					console.log("Error getting reminder");
				}
				else {
					vr.is_processed_today = true;
					vr.timeline.push(status);
					save(vr, function (err) {
						if(err) {
							//console.log("Error saving reminder: " + err);
						}
						else {
							//console.log("Saved the state of reminder");
						}
					});
				}
			}
		})
	})

	function save(voucher_reminder, cb) {
		voucher_reminder.save(function (err) {
			cb(err);
		})
	}
}