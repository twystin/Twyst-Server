var http = require('http');
http.post = require('http-post');
var M = require('mstring')

var phones_data = M(function(){
  /***
9871212520
9871633322
9820165960
9871303236
9971090349
9953901925
9953780781
9810619085
9911558655
9810530695
9911277614
9650462442
9910200535
9566813430
9873564891
9971959393
8750374730
9654414633
9910011920
9810374518
9818389103
8527027766
9818012979
9811889080
7206666782
9971007888
9871315901
9999745371
8447548648
9811280863
9582088757
9717911629
9711001790
9953019162
9015882295
9899830613
9873695638
9953729940
9211097401
9717077105
9818045855
9891499849
8527535020
9911975036
8375879987
9910395625
9958314448
9999812948
8826903169
9548290069
9500005916
9811181701
9711031989
8447183335
9910417998
8800992118
9810428757
7838304651
9560702628
9560993825
8295285546
7838474210
8860073353
8860725484
7895348619
8470054180
8447892221
9899442563
9650307308
9910095584
9892515474
9810323014
9910220949
9871073448
9818255718
9891452024
8860086869
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
		httpCheckin(phone);
	}, i * 1000);
})

function httpCheckin (phone) {
	console.log(phone)
	http.post('http://twyst.in/api/v2/checkins', {
		phone: phone,
        outlet: "534b82cb0a9281e4520001bf",
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: "Thank you for participating in The CUPnCAKE Factory's FIFA World Cup 2014 contest! As a small way of saying thanks, we have enrolled you into our new loyalty program on Twyst. You get a free beverage on your next visit (min bill Rs 250, present voucher code xxxxxx)! Check-in on Twyst on each visit for bigger rewards. Click http://goo.gl/Kowd8G to get Twyst for Android. See you at TCnCF!"
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