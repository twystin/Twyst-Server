var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');

var config = {
	'type': 'PROMO_MESSAGE',
	'from': 'TWYSTR',
	'sms_api': 'http://localhost:3000/api/v1/sms',
	'message': 'Testing',
	'csv_file_name': __dirname + '/a.csv',
};

initSms();
function initSms() {
	getPhoneNumbersFromFile(config.csv_file_name, function (phone_numbers) {
		async.each(phone_numbers, function (phone, callback) {
			httpCheckin(phone, function (data, response) {
				console.log(data);
				//console.log(response);
				callback();
			});
		}, function (err) {
			console.log('---------------------------------------');
			console.log(err || 'Completed Batch sms process');
		});
	});
};

function httpCheckin (phone, cb) {
	rest.post(config.sms_api, {
		data: {
			type: config.type,
			phone: phone,
	        from: config.from,
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
		console.log(row[0])
		phone_numbers.push(row[0]);
	})
	.on('end', function (count) {
		cb(phone_numbers);
	})
};
