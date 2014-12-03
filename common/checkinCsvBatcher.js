var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
var phones = '';
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/pinoz.csv', { encoding: 'utf8' }))
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
	        outlet: "54589240ca8b56097f961920",
	        location: 'DINE_IN',
	        created_date: new Date(),
	        batch_user: true,
	        message: "We love serving you at La Pino'z Pizza. As a way of saying thanks, we've enrolled you into our rewards program on Twyst. Get FREE Garlic Cheese Bread on your next order (voucher code: xxxxxx). See all rewards at La Pino'z Pizza at http://twyst.in/lpz. Today's special: Buy 1 get 1 free on medium / large pizzas."
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	readCsv(++index);
	})
}