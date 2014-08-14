var http = require('http');
http.post = require('http-post');
var M = require('mstring')

var phones_data = M(function(){
  /***
9871303236
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
	}, i * 500);
})

function httpCheckin (phone) {
	console.log(phone)
	http.post('http://localhost:3000/api/v2/checkins', {
		phone: phone,
        outlet: "530ef9f502bc583c21000010",
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: "We love having your over at Joint! As a small way of saying thanks, we have enrolled you into our new loyalty program on Twyst. You get 10% off on your next visit/order (Voucher code xxxxxx). Check-in on Twyst on each visit/order for bigger rewards (Free rolls & biryanis!). Click http://goo.gl/Kowd8G to get Twyst for Android."
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