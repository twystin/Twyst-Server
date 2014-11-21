var mongoose = require('mongoose');
mongoose.connect('localhost/twyst')
require('../config/config_models')();

var Account = mongoose.model('Account');
var Unsbs = mongoose.model('Unsbs');
var Outlet = mongoose.model('Outlet');
var SmsSender = require('../common/smsSender');

module.exports.smsBlacklister = function (code, phone) {
	var media = 'sms',
		message_type = 'remind';

	if(!code) {
		// Send sms to user
	}
	else {
		var q = {
			phone: phone
		};
		getUser(q, function (err, user) {
			if(err) {
				// Do nothing
			}
			else {
				if(!user) {
					// Fuck off saale
				}
				else {
					handleBlacklist(user, media, message_type, code);
				}
			}
		})
	}
}

function handleBlacklist(user, media, message_type, code) {
	Unsbs.findOne({
		user: user._id
	}, function (err, unsbs) {
		if(err) {
			// Do nothing
		}
		else {
			if(!unsbs) {
				var unsbs = {
					user: user._id,
					phone: user.phone
				}
				unsbs = new Unsbs(unsbs);

			}
			setUnsbs(unsbs, media, message_type, code);
		}
	})
}

function setUnsbs(unsbs, media, message_type, code) {
	if(code === 'ALL') {
		unsbs[media][message_type].all = true;
		saveUnsbs(unsbs, function (err) {
			// Do nothing for now
		});
	}
	else {
		Outlet.findOne({
			shortUrl: code
		}, function (err, outlet) {
			if(err) {

			}
			else {
				if(!outlet) {
					// Tell the user that no outlet exists
				}
				else {
					unsbs[media][message_type].outlets.push(outlet._id);
					saveUnsbs(unsbs, function (err) {
						if(!err) {
							if(media === 'sms') {
								var message = 'Thanks for your request. You will no longer receive reminders and updates from ' + outlet.basics.name + ' .';
								SmsSender.sendSms(unsbs.phone, message, 'UNSBS_MESSAGE');
							}
						}
					});
				}
			}
		})
	}
}

function saveUnsbs(unsbs, cb) {
	unsbs.save(function (err) {
		cb(err);
	})
}

function getUser(q, cb) {
	Account.findOne(q, function (err, user) {
		cb(err, user);
	})
}