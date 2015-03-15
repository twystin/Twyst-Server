var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var voucher = require('../models/voucher');
var Voucher = mongoose.model('Voucher');
mongoose.connect('mongodb://50.112.253.131/twyst');

var job = schedule.scheduleJob({minute: 38, dayOfWeek: [new schedule.Range(0,6)]}, main);

main();
function main() {
    var date = new Date();
    console.log("Job started at: " + date);
    var q = {
    	'used_details.used_time': {
    		$lt: new Date(date.getTime() - 3600000)
    	},
    	'basics.status': 'user redeemed'
    };
    redeemVouchers(q, function (err, num) {
    	if(err) {
    		console.log(err);
    	}
    	else {
    		console.log(num + ' vouchers redeemed');
    	}
    	console.log("Job finished at: " + date);
    })
}

function redeemVouchers(q, cb) {
	Voucher.update(q, {
        'basics.status': 'merchant redeemed'
    }, {
        multi: true
    }).exec(function (err, num) {
        cb(err, num)
    });
}