var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('./config/config_models')();

var Checkin = mongoose.model('Checkin');
var Outlet = mongoose.model('Outlet');
var voucher_gen = require('./voucherGenMistake')
mongoose.connect('mongodb://localhost/twyst');

var Voucher = mongoose.model('Voucher');

var Account = mongoose.model('Account');

Outlet.find({}, function (err, outlets) {
	outlets.forEach(function (o) {
		var city = o.contact.location.city.toLowerCase();
		if(city === 'delhi' 
			|| city === 'gurgaon' 
			|| city === 'noida' 
			|| city === 'new delhi') {
			console.log(typeof o.contact.location.locality_2)
			var url = '/' + 'ncr' + '/' +
				o.contact.location.locality_2[0] + '/' +
				o.basics.name + ' ' + o.contact.location.locality_1[0] + ' ' +
				o.contact.location.city;
		}
		else {
			var url = '/' + o.contact.location.city + '/' + 
				o.contact.location.locality_2[0] + '/'
				o.basics.name + ' ' + o.contact.location.locality_1[0];
		}
		url = url.replace(/'/g, '');
		url = url.replace(/& /g, '');
		url = url.replace(/- /g, '');
		url = url.replace(/\./g, '');
		url = url.replace(/!/g, '');
		url = url.replace(/ /g, '-');
		o.publicUrl = o.publicUrl || [];
		o.publicUrl.push(url.toLowerCase());
		console.log(url)
		// o.save(function (err) {
		// 	if(err) {
		// 		console.log(err)
		// 	}
		// })
	})
})

// Outlet.find({}, function (err, outlets) {
// 	outlets.forEach(function(o) {
// 		if(o.contact.location.locality_1.length === 0) {
// 			console.log("Location 1 empty for: "+ o.basics.name);
// 		}
// 		if(o.contact.location.locality_2.length === 0) {
// 			console.log("Location 2 empty for: "+ o.basics.name);
// 		}
// 	})
// })

// Checkin.find({'outlet': '530ef84902bc583c21000004',
// 				'created_date': {
// 						$gte: new Date(2014, 4, 24),
// 						$lte: new Date(2014, 7, 3)
// 				},
// 				'checkin_type': 'QR'
// 	}, function (err, checkins) {
// 		checkins = _.uniq(checkins, function (ch) {
// 			return ch.phone;
// 		});
// 		var distinct_checkins = checkins.length;
// 		hasPrevCheckins();
// 		function hasPrevCheckins () {
// 			checkins.forEach(function (ch) {
// 				Checkin.findOne({
// 					phone: ch.phone,
// 					created_date: {
// 						$lt: new Date(ch.created_date)
// 					}
// 				}, function (err, checkin) {
// 					if(checkin) {
// 						--distinct_checkins;
// 					}
// 					console.log(distinct_checkins)
// 				})
// 			})
// 		}
// })

// Voucher.find({}).select('gen_type').exec(function (err, vouchers) {
// 	console.log(vouchers.length)
// 	var a = 0, b =0;
// 	vouchers.forEach(function (vh) {
// 		if(!vh.gen_type) {
// 			vh.gen_type = 'NA';
// 			vh.save(function (err, s) {
// 				console.log(err || "succ")
// 			})
// 		}
// 	})
// })

// Voucher.find({
// 	'issue_details.issued_at': "5332a2924871e79576000c27",
// 	'issue_details.issue_time': {$lt: new Date(2014, 5, 14)},
// 	'issue_details.issue_date': {$gt: new Date(2014, 5, 13)} 
// }, function (err, vouchers) {
// 	console.log(vouchers.length)
// 	vouchers.forEach(function (vh) {
// 		vh.gen_type = 'BATCH';
// 		vh.save(function (err, s) {
// 			console.log(err || "succ")
// 		})
// 	})
// })

// Checkin.find({
// 	'outlet': "5316d59326b019ee59000026",
// 	'modified_date': {$lt: new Date(2014, 6, 11)},
// 	'created_date': {$gt: new Date(2014, 6, 10)} 
// }, function (err, checkins) {
// 	console.log(checkins.length)
// 	checkins.forEach(function (ch) {
// 		ch.checkin_type = "BATCH";
// 		ch.save(function (err, success) {
// 			console.log(err || "success")
// 		})
// 	})
// })

// Checkin.find({checkin_type: 'BATCH'}, function (err, checkins) {
// 	if(err) {
// 		console.log(err);
// 	}
// 	else {
// 		checkins.forEach(function (ch) {
// 			ch.checkin_type = "PANEL";
// 			ch.save(function (err, success) {
// 				console.log(err || success)
// 			})
// 		})
// 	}
// })

// Account.find({batch_user: true}, function (err, users) {
// 	users.forEach(function (user) {
// 		Checkin.findOne({phone: user.phone}, function (err, checkin) {
// 			if(err) {
// 				console.log(err);
// 			}
// 			else {
// 				if(checkin) {
// 					checkin.checkin_type = "PANEL";
// 					checkin.save(function (err) {
// 						console.log(err || "success")
// 					});
// 				}
// 			}
// 		})
// 	})
// })

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