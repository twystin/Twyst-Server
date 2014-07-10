var mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('./config/config_models')();

var Checkin = mongoose.model('Checkin');
var voucher_gen = require('./voucherGenMistake')
mongoose.connect('mongodb://twyst.in/twyst');

var Voucher = mongoose.model('Voucher');

var Account = mongoose.model('Account');

// PHONE NUMBER IN THE CHECKIN TABLE 10 DIGITS

// Checkin.find({}, function (err, checkins) {
//   checkins.forEach(function (ch) {
//     if(ch.phone && ch.phone.length > 10) {
//       ch.phone = ch.phone.substring(ch.phone.length-10, ch.phone.length);
//       ch.save(function (err, check) {
//           console.log(err)
//       });
//     }
//   })
// })

// USERNAME IS PHONE NUMBER IS REDUCED TO 10 DIGITS

// Account.find({}, function (err, accounts) {
//   accounts.forEach(function (acc) {
//     if(acc.phone) {
//       if(!isNaN(acc.username) && acc.username.length > 10) {
//         console.log(acc.username)
//         acc.username = acc.username.substring(acc.username.length-10, acc.username.length);
//         acc.save(function (err, account) {
//           console.log(err)
//         });
//       }
//     }
//   })
// })

// VOUCHER UPDATE IN THE  TABLE FOR SOME PROGRAM

// Voucher.find({
//     'issue_details.issued_at':"5316d59326b019ee59000026",
//     "issue_details.program" : "53b3cb0f484910756eadd5dd",
//     "issue_details.issue_time" : {$gt: new Date("2014-07-10T00:27:35.619Z")}
// }, function(err, vouchers) {
//   vouchers.forEach(function (voucher) {
//     voucher.issue_details.issued_for = "53b3cb0f484910756eadd5d1";
//     voucher.issue_details.issued_for = "53b3cb0f484910756eadd5db";
//     voucher.save(function (err, voucher) {
//       console.log(err)
//     });
//   })
// })

// CHECKIN AGGRGATE AND MISTAKE CORRECTOR FOR RAHUL SIR FORCED

// Checkin.aggregate({ $match: {
// 	    'checkin_program': mongoose.Types.ObjectId("535fb8feb7f678a830000046"),
//       'checkin_type': 'PANEL',
//       "created_date" : {
//             $lt: new Date("2014-06-16T00:00:58.669Z")
//         }
//     }},
//   	{ 
//   		$group: {
//     		_id: { 
//     			phone: "$phone" 
//     		},
//     	count: { 
//     		$sum: 1 
//     	} 
//   	}}, 
//   	{ 
//   		$match: { 
//     		count: { 
//     			$gte: 1
//     		} 
//   	} },
//   	{ 
//   		$sort : { 
//   			count : -1
//   		} 
//   	},
//   	{ 
//   		$limit : 2000 
//   	}, function (err, checkins) {
//         breakUsers(checkins);  		
// });

// function breakUsers(checkins) {
//   var i = 0;
//   var rem = checkins.length;
//   checkins.forEach(function (obj) {
//     if(obj.count === 3 || obj.count === 5 || obj.count === 7) {
//       setTimeout(function () {
//         voucher_gen.readProgramAndPopulateTiers(
//             mongoose.Types.ObjectId("531ec1c05b2e10b974000006"),
//             obj._id.phone,
//             true
//         )
//       }, 1000 * ++i);
//     }
//   })
// }

// // Mark all the ones already sent and QR