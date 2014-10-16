var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/0.csv', { encoding: 'utf8' }))
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
	        outlet: "5316d59326b019ee59000026",
	        location: 'HOME_DELIVERY',
	        created_date: new Date(),
	        batch_user: true,
	        message: "Crusty Pizza turns 1 year old today! As a small way of saying thanks for helping us reach here, we have checked you in to our Rewards program on Twyst (http://twy.st/app). Get 10% off at lunch (order between 1130am – 3pm). Mention your voucher xxxxxx when you call. ONLY FOR TODAY – call us, say Happy Birthday and we’ll send you a Free Pizza OR Gelato along with your order!!"
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	readCsv(++index);
	})
}