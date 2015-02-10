var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');

var config = {
	'csv_file_name': '/ccc.csv', // File path with phone numbers
	'checkin_url': 'http://twyst.in/api/v3/batch_checkins', // Checkin API
	'sms_sender_id': 'COFCHA', // SMS Sender ID (Leave blank if from TWYSTR)
	'outlet_id': '5332a73e4871e79576000c3a', // Outlet ID
	'checkin_location': 'DINE_IN', // Checkin location DINE_IN / HOME_DELIVERY
	'message': "Greetings from Coffee & Chai Co! We've enrolled you into our new rewards program on Twyst. Get a cup of Tea/Coffee free when you visit us next (Voucher Code xxxxxx, T&C: Min spend Rs 200). Get the Twyst app (http://twy.st/app) to check-in, unlock and Redeem your Rewards!"
}; // Message must have xxxxxx (To replace with voucher code) 

initCheckin();
function initCheckin() {
	getPhoneNumbersFromFile(config.csv_file_name, function (phone_numbers) {
		async.each(phone_numbers, function (phone, callback) {
			httpCheckin(phone, function (data, response) {
				console.log(data);
				//console.log(response);
				callback();
			});
		}, function (err) {
			console.log('---------------------------------------');
			console.log(err || 'Completed Batch checkin process');
		});
	});
};

function httpCheckin (phone, cb) {
	rest.post(config.checkin_url, {
		data: {
			sms_sender_id: config.sms_sender_id,
			phone: phone,
	        outlet: config.outlet_id,
	        location: config.checkin_location,
	        message: config.message
		}
	}).on('complete', function(data, response) {
		cb(data, response);	
	});
};

function getPhoneNumbersFromFile(file_name, cb) {
	var phone_numbers = [];
	csv()
	.from
	.stream(fs.createReadStream(__dirname + file_name, { encoding: 'utf8' }))
	.on('record', function (row, index) {	
		phone_numbers.push(row[0]);
	})
	.on('end', function (count) {
		cb(phone_numbers);
	})
};