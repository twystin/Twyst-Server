var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');
readCsv(0)
var phones = [];
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/ccc.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {	
		if(index > data_index) {
			phones.push(row[0]);
		}
	})
	.on('end', function (count) {
		console.log(count)
		async.eachSeries(phones, function (phone, callback) {
			httpCheckin(phone, function (err) {
				callback();
			});
		}, function (err) {
			console.log(err);
		});
	})
}

function httpCheckin (phone, cb) {
	rest.post('http://twyst.in/api/v3/batch_checkins', {
		data: {
			sms_sender_id: 'COFCHA',
			phone: phone,
	        outlet: "5332a73e4871e79576000c3a",
	        location: 'DINE_IN',
	        message: "Greetings from Coffee & Chai Co! We've enrolled you into our new rewards program on Twyst. Get a cup of Tea/Coffee free when you visit us next (Voucher Code xxxxxx, T&C: Min spend Rs 200). Get the Twyst app (http://twy.st/app) to check-in, unlock and Redeem your Rewards!"
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	console.log(phone)
	  	cb(null);
	})
}