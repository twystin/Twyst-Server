var http = require('http');
http.post = require('http-post');
var M = require('mstring')

var phones_data = M(function(){
  /***
9871303236
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
	}, i * 1000);
})

function httpCheckin (phone) {
	console.log(phone)
	http.post('http://localhost:3000/api/v2/batch_checkins', {
		phone: phone,
        outlet: "540ea3d32f61834b5170eb10",
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: "We love serving you at Beyond Breads! As a small way of saying thanks, we've enrolled you into our new rewards program on Twyst. Get 15% off on your next order (delivery 5pm-11pm). Mention your voucher code xxxxxx when you call. Order now!"
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