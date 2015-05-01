var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');

var config = {
	'csv_file_name': __dirname + '/kebabnama_Batch_4Mar.csv', // File path which has phone numbers
	'checkin_url': 'http://twyst.in/api/v3/batch_checkins', // Checkin API
	'sms_sender_id': 'TWYSTR', // SMS Sender ID (Leave blank if from TWYSTR)
	'outlet_id': '54f176df741757d16566d663', // Outlet ID
	'checkin_location': 'HOME_DELIVERY', // Checkin location DINE_IN / HOME_DELIVERY
	'message': "We love serving you at Kebabnama! As a way of saying thanks, we have enrolled you into our new rewards program on Twyst! You get a free Veg/Chicken Romali Wrap (Voucher code: xxxxxx, Min bill Rs 400). Find Kebabnama on Twyst http://twyst.in/kbn"
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
			phone_numbers.push(row[0]);
	})
	.on('end', function (count) {
		cb(phone_numbers);
	})
};
