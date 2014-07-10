var http = require('http');
http.post = require('http-post');
var M = require('mstring')

var phones_data = M(function(){
  /***
9971090349
9810999086
9820165960
***/});

phones_data = phones_data.split(/\n/);
var phones = [];
phones_data.forEach(function (p) {
	p = p.replace(/\r/g, '');
	if(p.length === 10) {
		phones.push(p);
	}
})
console.log(phones)
var i = 0;
phones.forEach(function (phone) {
	++i;
	setTimeout(function() {
		console.log(phone)
		//httpCheckin(phone);
	}, i * 1000);
})

function httpCheckin (phone) {
	console.log(phone)
	http.post('http://twyst.in/api/v2/checkins', {
		phone: phone,
        outlet: '530eff0e02bc583c2100001b',
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: 'We love having you over at Cocktails & Dreams Speakeasy! As a small way of saying thanks, we have enrolled you into our new loyalty program on Twyst. You get a complimentary drink on your next visit (Voucher code xxxxxx). Check in on Twyst on each visit for bigger rewards. Click http://goo.gl/Kowd8G to get Twyst for Android. See you at Speaks!'
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