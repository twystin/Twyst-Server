var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
var async = require('async');
readCsv(0)
var phones = [];
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/smug.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {	
		if(index > 1000) {
			phones.push(row[0]);
		}
	    // if (index === data_index) {
	    // 	httpCheckin(index, row[0]);
	    // }
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
	console.log(phone)
	rest.post('http://twyst.in/api/v3/batch_checkins', {
		data: {
			phone: phone,
	        outlet: "5491a7abd031388c54653b35",
	        location: 'DINE_IN',
	        message: "We've loved serving you at Smugglers! As a way of saying thanks, we've enrolled you into our rewards program on Twyst. Get a free drink with your meal on your next visit (Voucher code: xxxxxx. Min. bill Rs 500). See all our rewards at http://twyst.in/smu Special offer: Get 15% off on all orders till 31-Dec!"
		}
	}).on('complete', function(data, response) {
	  	//console.log(data)
	  	cb(null);
	})
}