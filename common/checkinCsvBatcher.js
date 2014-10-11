var http = require('http');
http.post = require('http-post');
var csv = require('csv');
var fs = require("fs");

csv()
.from.stream(fs.createReadStream(__dirname + '/cb_batch.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index == 0) {
    	var phone = row[0];
    	console.log(phone)
    	console.log(index);
        httpCheckin(phone);
    }
})
.on('end', function (count) {
	console.log("I am finished.")
})

function httpCheckin (phone) {
	console.log(phone)
	http.post('http://localhost:3000/api/v2/batch_checkins', {
		phone: phone,
        outlet: "5402cc64ad0d0ffd5aa44817",
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: "We love serving you at Captain Bill$ Deliverz! As a small way of saying thanks, we have enrolled you into our new rewards program on Twyst. We also have a special offer for you this October - 1 plus 1 on any Soup, Starter or Biryani for additional Rs. 50* only! Check-in on Twyst on each order for bigger rewards. Get Twyst http://twy.st/app"
	},
	function(res){
		console.log(res.statusCode);
		var body;
		res.on('data', function(chunk) {
	        // append chunk to your data
	        body += chunk;
	    });

	    res.on('end', function() {
	        console.log(body);
	    });

	    res.on('error', function(e) {
	        console.log("Error message: " + e.message)
	    });
	});
}