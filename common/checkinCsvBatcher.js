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
		console.log(count)
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
	        outlet: "54a390904a9f96a41bbe870d",
	        location: 'DINE_IN',
	        message: "We love serving you at The Spice Lab! As a way of saying thanks, we've enrolled you into our new rewards program on Twyst! Get Twyst for your phone (http://twy.st/app) to redeem your reward (Free Bhuna Aloo Chaat!). Today's Special: Planning a house party for New Year eve? Get 10% off on orders above Rs 5000. Order needs to be placed by 2pm. Call 01244101111"
		}
	}).on('complete', function(data, response) {
	  	//console.log(data)
	  	console.log(phone)
	  	cb(null);
	})
}