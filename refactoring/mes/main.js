var schedule = require('node-schedule');
var async = require('async');
require('../../config/config_models')();
var mongoose = require('mongoose');
var Program = mongoose.model('Program');

mongoose.connect('mongodb://localhost/twyst');

function main() {
	getRules(function (err, rules) {
		if(err) {
			console.log("Error getting rules. Please check.")
		}
		else {
			if(!rules || !rules.length) {
				console.log("Got no rules for now. Get me some tasks.")
			}
			else {
				processRules(rules, function (err, results) {
					if(err) {
						console.log("Error in processing rules.")
					}
					else {

					}
				});
			}
		}
	})
}

function processRules(rules, cb) {
	async.each(rules, function (r, callback) {
        if(r.rule_type === 'VOUCHER_EXPIRY') {
        	processExpiringVouchers(r, function (err, vouchers) {
        		if(err) {
        			console.log("Error processing expiring vouchers. " + err);
        			callback(err, null);
        		}
        		else {
        			console.log(vouchers);
        			callback(null, vouchers);
        		}
        	})
        }
    }, function (err) {
        cb(err, objects);
    })
}

function processExpiringVouchers (rule, cb) {
	getExpiringProgram(rule.time, function (err, program) {
		if(err) {
			cb(err, []);
		}
		else {
			if(!program) {
				cb(null, []);
			}
			else {
				getExpiringVouchers(program, function (err, vouchers) {
					cb();
				})
			}
		}
	})
}

function getExpiringVouchers (program, cb) {
	Voucher.find({
		'basics.status': 'active',
		'issue_details.program': program._id
	}, function (err, vouchers) {
		cb(err, vouchers);
	})
}

function getExpiringProgram(time, cb) {
	var today = new Date();
	var today_plus_time = new Date(Date.now() + time * 7 * 24 * 60 * 60 * 1000);
	Program.findOne({
		'status': 'active',
		'validity.burn_end': {
			$gt: today,
			$lt: today_plus_time
		}
	}, function (err, program) {
		cb(err, program);
	})
}

function getQueries(cb) {
	cb(null, [{rule_type: 'VOUCHER_EXPIRY', time: 7}]);
}
