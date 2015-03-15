var _ = require('underscore'),
	keygen = require("keygenerator"),
	async = require('async');
var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher'),
	Winback = mongoose.model('Winback'),
	Outlet = mongoose.model('Outlet'),
	Checkin = mongoose.model('Checkin'),
	Account = mongoose.model('Account');

var Transport = require('./transport');

module.exports.filterUsers = function(winback, users) {
	var filtered_users = filterByDate(winback, users);
	var winback_filtered_users = [];
	async.each(filtered_users, function (f, callback) {
		hasWinbackAlready(f, winback, function (err, account, status) {
			if(err) {
				callback(err);
			}
			else {
				if(account && !status) {
					winback_filtered_users.push(account);
				}
				callback();
			}
		})
	}, function (err) {
		if(err) {
			console.log("Error filtering user: " + new Date());
		}
		else {
			console.log("Filtered users successfully: " + new Date());
			if(winback_filtered_users.length) {
				generateVouchers(winback, winback_filtered_users);
			}
			else {
				console.log("No user found for this winback: " + winback.name + ' ' + new Date());
			}
		}
	})
}

function generateVouchers(winback, users, cb) {
    async.each(users, function (u, callback) {
        saveVoucher(u, winback, function (err, voucher) {
        	if(err) {
        		callback(err);
        	}
        	else {
        		Transport.handleMessage(u, winback, voucher);
        	}
        });
    }, function (err) {
        if(err) {
        	console.log("Error saving voucher: "+ new Date());
        }
        else {
        	console.log("Done the winback execution");
        }
    })
}

function saveVoucher(user, winback, cb) {
	var voucher = getVoucherObject(winback, user);
	voucher = new Voucher(voucher);
	voucher.save(function (err) {
		cb(err, voucher);
	})
}

function getVoucherObject(winback, user) {
	var voucher = {
		basics: {
			code: keygen._({
				forceUppercase: true, 
				length: 6, 
				exclude:['O', '0', 'L', '1']
			}),
			type: 'WINBACK'
		},
		validity: {
			start_date: new Date(),
	        end_date: Date.now() + winback.validity.voucher_valid_days * 86400000,
	        number_of_days: winback.validity.voucher_valid_days
		},
		issue_details: {
			winback: winback._id,
			issued_at: winback.outlets.map(function (o) {
				return o._id;
			}),
			issued_to: user._id
		}
	}
	voucher.validity.end_date = new Date(voucher.validity.end_date);
	voucher.validity.end_date = setHMS(voucher.validity.end_date, 23, 59, 59);
	return voucher;
}

function filterByDate(winback, users) { 
	var filtered_users = [];
	var date_since_last_visit = setHMS(winback.date_since_last_visit, 23, 59, 59);
	users.forEach(function (u) {
		u.dates = _.sortBy(u.dates, function (d) {
			return -d;
		});
		if(u.dates[0] < date_since_last_visit) {
			filtered_users.push(u);
		}
		// if(u._id == '9871303236') {
		// 	filtered_users.push(u);
		// }
	});
	return filtered_users;
}

function hasWinbackAlready(user, winback, callback) {
	Account.findOne({
		phone: user._id
	}, function (err, account) {
		if(err) {
			callback(err, account, false);
		}
		else {
			if(!account) {
				callback(err, account, false);
			}
			else {
				hasWinbackVoucherForProgram(account);
			}
		}
	})

	function hasWinbackVoucherForProgram(account) {
		Voucher.findOne({
			'issue_details.issued_to': account._id,
			'issue_details.winback': winback._id
		}, function (err, voucher) {
			if(err) {
				callback(err, account, false);
			}
			else {
				if(voucher) {
					callback(err, account, true);
				}
				else {
					callback(err, account, false);
				}
			}
		})
	}
}

function setHMS(date, h, m, s) {
	date.setHours(h || 0);
	date.setMinutes(m || 0);
	date.setSeconds(s || 0);
	return date;
}