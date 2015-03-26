module.exports.run = function(success,error) {

}

var schedule = require('node-schedule');
var async = require('async');
var _ = require('underscore');
require('../../config/config_models')();
var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Transport = require('./transport');
mongoose.connect('mongodb://localhost/twyst');

var job = schedule.scheduleJob({hour: 6, minute: 30, dayOfWeek: [new schedule.Range(0,6)]}, main);
main();
function main() {
	getVouchers(getFilterQuery(), function (err, vouchers) {
		if(err) {
			console.log("Date " + new Date() + ' Error ' + err);
		}
		else {
			if(vouchers && vouchers.length) {
				processVouchers(vouchers);
			}
			else {
				console.log("Date " + new Date() + ' No vouchers for reminder');
			}
		}
	});
}

function processVouchers(vouchers) {
	for(var i = 0; i < vouchers.length; i++) {
		if(!vouchers[i].issue_details
			|| !vouchers[i].issue_details.issued_to
			|| !vouchers[i].issue_details.issued_to.phone) {
			vouchers.splice(i, 1);
		}
	};
	vouchers = _.uniq(vouchers, function (v) {
		return v.issue_details.issued_to.phone;
	});
	vouchers.forEach(function (v) {
		Transport.handleReminder(v);
	});
}

function getVouchers(q, cb) {
	Voucher
	.find(q)
	.populate('issue_details.issued_at')
	.populate('issue_details.issued_to')
	.exec(function (err, vouchers) {
		cb(err, vouchers);
	});
}

function getFilterQuery() {
	var date = {
		'first_cycle': {
			$gt: getRealDate(7),
			$lt: getRealDate(6)
		},
		'second_cycle': {
			$gt: getRealDate(14),
			$lt: getRealDate(13)
		},
		'validity': {
			$lt: new Date(Date.now() + 14 * 86400000).setHours(0, 0, 1)
		}
	};

	var q = {
		'basics.status': 'active',
		'validity.end_date': date.validity,
		$or:[{
				'checkin_details.batch': true,
				'basics.created_at': date.first_cycle
			},
			{
				'checkin_details.batch': false,
				'basics.created_at': date.first_cycle
			},
			{
				'checkin_details.batch': false,
				'basics.created_at': date.second_cycle
			}
		]
	};
	return q;
}

function getRealDate(day_before) {
	return new Date(Date.now() - day_before * 86400000).setHours(0, 0, 1);
};
