var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
var phones = '';
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/bbr.csv', { encoding: 'utf8' }))
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
	        outlet: "540ea3d32f61834b5170eb10",
	        location: 'DINE_IN',
	        created_date: new Date(),
	        batch_user: true,
	        message: "We love serving you at Beyond Breads! As a way of saying thanks, we've enrolled you into our new rewards program on Twyst. Get 2 free pastries on your next order (Voucher code: xxxxxx). See all rewards at http://twyst.in/bbr"
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	readCsv(++index);
	})
}