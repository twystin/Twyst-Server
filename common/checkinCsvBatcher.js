var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
var phones = '';
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/5rmk.csv', { encoding: 'utf8' }))
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
	        outlet: "5477286c57a9f9d74cccf843",
	        location: 'DINE_IN',
	        created_date: new Date(),
	        batch_user: true,
	        message: "Rumis Kitchen is back with new zeal, and we want to thank you for your kind patronage. Get 30% OFF ON YOUR NEXT ORDER at Rumi’s (voucher code xxxxxx) via our rewards program on Twyst! To claim just give us your voucher code when you call. Hurry, vouchers expire on 04-Dec. See all our rewards at http://twyst.in/rmk."
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	readCsv(++index);
	})
}