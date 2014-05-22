var SmsSender = require('./smsSender');

var csv = require('csv');
var fs = require('fs');

csv()
.from.stream(fs.createReadStream(__dirname + '/bb_sms.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index >= 0) {
        var number = row[0];
        var message = 'Have you redeemed your reward at Biryani Blues yet? Your voucher expires tomorrow 23 May, so hurry! Stay connected with Biryani Blues on Twyst, click http://twyst.in/download/%23/'+ number +' to get Twyst for Android.';
		SmsSender.sendSms(number, message);
    }
})
.on('end', function (count) {
    console.log("Message sent to all the users");
})
.on('error', function (error) {
    console.log(error.message);
});