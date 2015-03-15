var schedule = require('node-schedule'),
	keygen = require("keygenerator"),
	async = require('async');
require('../../config/config_models')();
var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher'),
	Winback = mongoose.model('Winback'),
	Outlet = mongoose.model('Outlet'),
	Checkin = mongoose.model('Checkin'),
	Account = mongoose.model('Account');

var Filter = require('./filter');

mongoose.connect('mongodb://50.112.253.131/twyst');

var job = schedule.scheduleJob({minute: 38, dayOfWeek: [new schedule.Range(0,6)]}, main);
main();
function main() {
	getWinbacks(function (err, winbacks) {
		if(err) {
			console.log("Error getting winbacks. " + new Date());
		}
		else {
			if(winbacks && winbacks.length > 0) {
				async.each(winbacks, function (w, callback) {
					if(w.outlets.length > 0) {
						getUsers(w, function (err, users) {
				        	if(err) {
				        		callback(err);
				        	}
				        	else {
				        		Filter.filterUsers(w, users);
				        	}
				        });
					}
					else {
						console.log("Winback has no outlets. Winback ID: " + w._id + ' ' + new Date());
					}
			    }, function (err) {
			    	if(err) {
			    		console.log("Error executing winbacks: " + new Date());
			    	}
			    	else {
			    		console.log("Done the winbacks " + new Date());
			    	}
			    })
			}
			else {
				console.log("No winbacks found currently." + new Date());
			}
		}
	})
};

function getUsers(winback, cb) {
	Checkin.aggregate({
		$match: {
			outlet: {
				$in: winback.outlets.map(function (o) {
					return mongoose.Types.ObjectId(o._id);
				})
			}
		}
	}, {
		$group :{
			_id: '$phone',
			count: {
				$sum: 1
			},
			dates: {
				$push: '$checkin_date'
			}
		}
	}, {
		$match: {
			count: {
				$gte: winback.min_historical_checkins
			}
		}
	}, function (err, op) {
		cb(err, op);
	})
}

function getWinbacks(cb) {
	Winback.find({
		'status': 'active',
		'validity.earn_start': {
			$lt: new Date(),
		},
		'validity.earn_end': {
			$gt: new Date(),
		}
	})
	.populate('outlets')
	.exec(function (err, winbacks) {
		cb(err, winbacks);
	})
}
