var schedule = require('node-schedule'),
	async = require('async'),
	Utils = require('../../common/utilities'),
	Mailer = require('../mailer/mailer.js'),
	schedule = require('node-schedule');
require('../../config/config_models')();
var mongoose = require('mongoose');
mongoose.connect('mongodb://50.112.253.131/twyst');
var Voucher = mongoose.model('Voucher'),
	Outlet = mongoose.model('Outlet'),
	Checkin = mongoose.model('Checkin'),
	Account = mongoose.model('Account');
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
//main()
var job = schedule.scheduleJob({hour: 6, minute: 30, dayOfWeek: [new schedule.Range(0,6)]}, main)
function main() {
	console.log("The job starts for today: " + new Date());
	getOutlets(function (err, outlets) {
		if(err) {
			console.log(new Date());
			console.log(err);
		}
		else {
			if(!outlets || !outlets.length) {
				console.log("No outlets found: " + new Date());
			}
			else {
				getMerchants(outlets);
			}
		}
	})
}

function collectData(user, o, q) {
	var prev_date = new Date(new Date().getTime() - 86400000);
	var details = {
		type: 'DAILY_DIGEST',
		subject: 'Your Twyst Activity on ',
		to: null,
		data: {
			merchant_name: null,
			outlet_name: null,
			outlet_loc: null,
			total_users: 0,
			today_date: prev_date,
			today_checkins: 0,
			last_seven_day_avg: 0,
			month: {
				name: null,
				checkins_count: 0,
				redeems_count: 0,
				new_users_count: 0,
				repeat_users: 0
			},
			outlet_url: null
		}
	}
	details.to = user.email;
	details.data.merchant_name = user.contact_person ? user.contact_person.split(' ')[0] : "User";
	details.data.outlet_name = o.basics.name;
	details.data.outlet_loc = o.contact.location.locality_1;
	details.data.outlet_url = "http://twyst.in/" + o.shortUrl[0];
	details.data.today_date = Utils.formatDate(prev_date);
	details.data.month.name = months[prev_date.getMonth()];
	details.subject += details.data.today_date;
	async.parallel({
	    total_users: function(callback) {
	    	getUniqueUsersCount(o._id, callback);
	    },
	    today_checkins: function(callback) {
	    	var query = {
	    		outlet: o._id,
	   			checkin_date: {
	   				$gt: q.today_date
	   			}
	    	};
	    	getCheckinCount(query, callback);
	    },
	    last_seven_day_checkins: function (callback) {
	    	var query = {
	    		outlet: o._id,
	   			checkin_date: {
	   				$gt: q.date_before_seven_days
	   			}
	    	};
	    	getCheckinCount(query, callback);
	    },
	    monthly_checkins: function (callback) {
	    	var query = {
	    		outlet: o._id,
	   			checkin_date: {
	   				$gt: q.first_date_of_month
	   			}
	    	};
	    	getCheckinCount(query, callback);
	    },
	    monthly_redeems: function (callback) {
	    	var query = {
	    		'basics.status': 'merchant redeemed',
	    		'used_details.used_at': o._id,
	   			'used_details.used_time': {
	   				$gt: q.first_date_of_month
	   			}
	    	};
	    	getRedeemCount(query, callback);
	    },
	    monthly_new_repeat_users: function (callback) {
	    	getMonthlyUserData(o._id, q, callback);
	    }
	}, function(err, results) {
		if(err) {
			console.log(err);
			console.log(new Date());
		}
		else {
			details.data.total_users = results.total_users;
			details.data.today_checkins = results.today_checkins;
			details.data.last_seven_day_avg = Math.floor(results.last_seven_day_checkins / 7);
		    details.data.month.checkins_count = results.monthly_checkins;
		    details.data.month.redeems_count = results.monthly_redeems;
		    details.data.month.new_users_count = results.monthly_new_repeat_users.new_users;
		    details.data.month.repeat_users = results.monthly_new_repeat_users.repeat_users;
			Mailer.sendEmail(details);
		}
	});
}

function getMonthlyUserData(outlet_id, q, cb) {
	var query = {
		outlet: outlet_id,
		checkin_date: {
			$gt: q.first_date_of_month
		}
	};
	var data = {
		new_users: 0,
		repeat_users: 0
	}
	getUniqueUsers(query, function (err, phones) {
		if(err) {
			cb(err, data);
		}
		else {
			if(!phones || !phones.length) {
				cb(err, data);
			}
			else {
				query = {
					outlet: outlet_id,
					checkin_date: {
						$lt: q.first_date_of_month
					},
					phone: {
						$in: phones
					}
				};
				getRepeatUsersCount(query, function (err, count) {
					if(err) {
						cb(err, data);
					}
					else {
						data.new_users = phones.length - count;
						data.repeat_users = count;
						cb(err, data);
					}
				})
			}
		}
	})
}

function getRepeatUsersCount(query, cb) {
	Checkin.find(query).distinct('phone', function (err, phones) {
		cb(err, phones ? phones.length : 0);
	});
}

function getUniqueUsers(q, cb) {
	Checkin.find(q)
	.distinct('phone', function (err, phones) {
		cb(err, phones);
	})
}

function getRedeemCount(q, cb) {
	Voucher.count(q, function (err, count) {
		cb(err, count);
	})
}

function getCheckinCount(q, cb) {
	Checkin.count(q, function (err, count) {
		cb(err, count);
	})
}

function getUniqueUsersCount(outlet_id, cb) {
	Checkin.find({
		outlet: outlet_id
	})
	.distinct('phone', function (err, phones) {
		cb(err, phones ? phones.length : 0);
	})
}

function getMerchants(outlets) {
	var q = getQuery();
	async.each(outlets, function (o, callback) {
		getMerchant(o.outlet_meta.accounts, function (err, user) {
			if(err || !user) {
				console.log(err);
				console.log(new Date());
				callback(err);
			}
			else {
				if(!user.email) {
					console.log("User has no email");
					console.log(user.username);
					console.log(new Date());
				}
				else {
					collectData(user, o, q);
				}
				callback();
			}
		})
	}, function (err) {
		if(err) {
			console.log(err);
			console.log(new Date());
		}
	})
}

function getQuery() {
	var prev_date = new Date(new Date().getTime() - 86400000);
	return {
		today_date: setZeroTime(prev_date),
		date_before_seven_days: setZeroTime(new Date(prev_date.getTime() - 8 * 86400000)),
		first_date_of_month: setZeroTime(new Date(prev_date.getFullYear(), prev_date.getMonth(), 1))
	}
}

function setZeroTime(date) {
	return date.setHours(0, 0, 0, 1);
}

function getMerchant(accounts, cb) {
	Account.findOne({
		_id: {
			$in: accounts
		},
		role: 3
	}).exec(function (err, user) {
		cb(err, user);
	})
}

function getOutlets(cb) {
	Outlet.find({
		'outlet_meta.status': 'active'
	})
	.select('basics outlet_meta shortUrl contact.location.locality_1')
	.exec(function (err, outlets) {
		cb(err, outlets);
	})
}