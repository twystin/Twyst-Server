var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');

var config = {
	'csv_file_name': __dirname + '/ccc.csv', // File path which has phone numbers
	'checkin_url': 'http://twyst.in/api/v3/batch_checkins', // Checkin API
	'sms_sender_id': 'BEYBRD', // SMS Sender ID (Leave blank if from TWYSTR)
	'outlet_id': '540ea3d32f61834b5170eb10', // Outlet ID
	'checkin_location': 'HOME_DELIVERY', // Checkin location DINE_IN / HOME_DELIVERY
	'message': "We love serving you at Beyond Breads! As a way of saying thanks, we have given you a free check-in into our new rewards program on Twyst! Now get 12% off on your next order, your voucher code is xxxxxx. Find all rewards at Beyond Breads at http://twyst.in/bbr"
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
	.stream(fs.createReadStream(file_name, { encoding: 'utf8' }))
	.on('record', function (row, index) {
		if(index < 5) {
			phone_numbers.push(row[0]);
		}
	})
	.on('end', function (count) {
		cb(phone_numbers);
	})
};
