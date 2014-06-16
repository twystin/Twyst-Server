var http = require('http');
http.post = require('http-post');
var M = require('mstring')

var phones = M(function(){
  /***
  9873410399
9910041645
9820267473
7503862183
9873832375
8527400808
9910758859
9899722258
8350420436
9999906330
9899557936
8527794210
9811499742
9810213467
9888817017
9899194950
9899115313
8860333722
9871281433
9810697888
8146400069
8500719292
9717660808
9891547676
8860237298
9560002411
9936476488
9999210181
9910444638
9953559556
9999457342
9873918724
8390417338
9958429222
9015101300
9311001481
8527201542
8860080933
9953053774
9818725487
9810000427
9674067543
9560047543
9810468073
8527500189
9910228624
9718963641
9717271212
9871492908
9999891308
9818855175
9582225370
9811837595
9971999576
9811607795
9999770057
9818174729
9560565256
9650008660
9990399817
8130200166
9810030564
9999300875
9650363888
9999444231
9650339073
9810266345
9873550237
9910138179
8130660707
9811368486
9811147596
9899193316
9910029192
9810056249
8527698564
9873560294
9718215828
9582158593
9711942015
8826755855
9899358960
9871014601
9958545417
8826824751
8130968370
9873009187
9810089539
9810021848
8802021848
9999918648
9899004672
9278385141
9811038806
9811851163
9811366024
9999367861
9582946912
9953944558
9582352796
9654344449
9958010555
9871386224
9810448954
9810352420
9811548705
9871787134
9811065246
9654533770
8860638940
8882188230
9911064887
9873184480
9810226745
9840078183
9958861697
9958988615
9810744014
9810520631
9873377372
7838360390
9560400618
9958344133
8586976999
9654254541
9871947848
9582503390
9810927736
8447077779
9711570092
9991051533
9717072048
7838718887
9650260145
9971697651
9891175860
9650016487
9711184600
9871386224
8587829229
9871153748
9731496901
9582928528
9953888956
9560508760
9971577979
9650010702
9958849890
9953455508
9717333443
9971577979
9990696350
9810767099
7838301914
9582628461
9899282347
9811983385
9953110297
8800968762
7838070002
8860956265
9870766707
9990939311
9899997066
8882654312
8930458271
9582220919
8860958008
9891721000
9818239027
9910318687
9990745002
9999854616
9560115550
8800904744
9810448083
9999510378
9650056664
9810321120
9910706608
9810024231
8800149512
8860180808
9990763131
9811100030
9717172660
9891155403
7838989599
9999693358
9811100439
9810840412
9810530913
9650959234
9810402461
9810113991
8860080790
8527781110
9811209139
9810048213
8527698500
9910010295
9711095129
9818700385
9910278908
8527335656
9871614888
9873723003
9811299895
9810284732
9717108885
9899629055
7838989599
9999535400
9810113833
9818520288
9873675628
9971090349
9871303236
9820165960
9818227447

***/});

phones = phones.split(/\r\n/);

var i = 0;
phones.forEach(function (phone) {
	++i;
	setTimeout(function() {
		httpCheckin(phone);
	}, i * 1000);
})

function httpCheckin (phone) {
	http.post('http://twyst.in/api/v2/checkins', {
		phone: phone,
        outlet: '5332a2924871e79576000c27',
        location: 'DINE_IN',
        created_date: new Date(),
        batch_user: true,
        message: 'We loved having you over at Tughlaq! As a small way of saying thanks, we have enrolled you into our new loyalty program on Twyst. Enjoy a complimentary dessert on your next visit or order (Voucher code xxxxxx). Check-in on Twyst on each visit for bigger rewards. Click URL to get Twyst for Android. See you at Tughlaq!'
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