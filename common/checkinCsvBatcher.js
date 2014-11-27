var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
var phones = '';
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/fnz.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {		
	    if (index === data_index) {
	    	httpCheckin(index, row[0]);
	    }
	})
	.on('end', function (count) {
		//console.log(count)
		console.log("I am finished.")
	})
}

function httpCheckin (index, phone) {
	console.log(phone)
	rest.post('http://twyst.in/api/v2/batch_checkins', {
		data: {
			phone: phone,
	        outlet: "5445f7c247f75ed312fc91e3",
	        location: 'DINE_IN',
	        created_date: new Date(),
	        batch_user: true,
	        message: "We hope you had fun at the FrenZone event! As a small way of saying thanks for participating, we've enrolled you into our new rewards program on Twyst. You get 15% off on your next visit (Voucher code: xxxxxx). The more you visit, the bigger your rewards! Get Twyst (http://twy.st/app) to track your rewards easily and stay connected to FrenZone."
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	readCsv(++index);
	})
}