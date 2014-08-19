var http = require('http');
http.post = require('http-post');
var M = require('mstring')

var phones_data = M(function(){
  /***
9999400013
***/});
phones_data = phones_data.split(/\n/);

var phones = [];
phones_data.forEach(function (p) {
	p = p.replace(/\r/g, '');
	if(p.length >= 10) {
		phones.push(p);
	}
});

var i = 0;
phones.forEach(function (phone) {
	++i;
	setTimeout(function() {
		//console.log(phone)
		httpCheckin(phone);
	}, i * 1000);
})

function httpCheckin (phone) {
	console.log(phone)
	http.post('http://twyst.in/api/v2/checkins', {
		phone: phone,
        outlet: "530ef9f502bc583c21000010",
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: "We love having you over at the Joint Cafe! Catch the amazing PARK JAZZ QUARTET (Prannai, Abhinav, Rohit and Kartikeya) LIVE from 9 PM onwards tonight (14 Aug). AND courtesy a free check-in to our rewards program on Twyst, get 10% OFF on your bill by showing this voucher code xxxxxx - just for tonight!"
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