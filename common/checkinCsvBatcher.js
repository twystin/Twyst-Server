var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');
readCsv(0)
var phones = [];
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/crus.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {	
		phones.push(row[0]);
	})
	.on('end', function (count) {
		//console.log(count)
		console.log("I am finished.")
		phones.forEach(function (phone) {
			httpCheckin(phone, function (err) {
				
			})
		});
	})
}

function httpCheckin (phone, cb) {
	rest.post('http://twyst.in/api/v3/batch_checkins', {
		data: {
			phone: phone,
	        outlet: "5316d59326b019ee59000026",
	        location: 'DINE_IN',
	        message: 'Merry Christmas from Crusty! Here is a holiday gift specially for you: 1 free check-in into our new rewards program on Twyst! You get a free 6" Garlic & Herbs pizza on your next visit to our new Baani Square outlet (Voucher code: xxxxxx). Happy holidays!'
		}
	}).on('complete', function(data, response) {
	  	//console.log(data)
	  	console.log(phone)
	  	cb(null);
	})
}