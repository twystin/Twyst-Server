var rest = require('restler');
var csv = require('csv');
var fs = require("fs");
readCsv(0)
var phones = '';
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/cds.csv', { encoding: 'utf8' }))
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
	        outlet: "530eff0e02bc583c2100001b",
	        location: 'DINE_IN',
	        created_date: new Date(),
	        batch_user: true,
	        message: "Cocktails n Dreams Speakeasy is turning 2, and the party lasts all week! 19-25 Dec, get a free drink from Speaks on each check-in! Here’s your first free drink voucher xxxxxx – just show this message to claim. Find Speakeasy on Twyst, http://twyst.in/cds"
		}
	}).on('complete', function(data, response) {
	  	console.log(data)
	  	//readCsv(++index);
	})
}