var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');
readCsv(1000)
var phones = [];
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/flip.csv', { encoding: 'utf8' }))
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
			sms_sender_id: 'FLIPER',
			phone: phone,
	        outlet: "54c3379be39f3eba4dc9c690",
	        location: 'DINE_IN',
	        message: "We love serving you at Flip Bistro and Pizzeria! As a way of saying thanks, we've enrolled you into our new rewards program powered by Twyst. Get Twyst for your phone (http://twy.st/app) to view & redeem your rewards! Republic Day Weekend (24-26 Jan) special, Buy 1 pizza and get 50% off on the 2nd. Call 9810054440 (Galleria), 0124 4200303 (Golf Course Road)"
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	console.log(phone)
	  	cb(null);
	})
}