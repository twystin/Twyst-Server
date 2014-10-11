var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/cb_batch.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {
	    if (index === data_index) {
	    	httpCheckin(index, row[0]);
	    }
	})
	.on('end', function (count) {
		console.log("I am finished.")
	})
}

function httpCheckin (index, phone) {
	console.log(phone)
	rest.post('http://twyst.in/api/v2/batch_checkins', {
		data: {
			phone: phone,
	        outlet: "5402cc64ad0d0ffd5aa44817",
	        location: 'DINE_IN',
	        created_date: new Date(),
	        batch_user: true,
	        message: "We love serving you at Captain Bill$ Deliverz! As a small way of saying thanks, we have enrolled you into our new rewards program on Twyst. We also have a special offer for you this October - 1 plus 1 on any Soup, Starter or Biryani for additional Rs. 50* only! Check-in on Twyst on each order for bigger rewards. Get Twyst http://twy.st/app"
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	readCsv(++index);
	})
}