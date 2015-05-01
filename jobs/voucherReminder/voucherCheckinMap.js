require('../../config/config_models')();
var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Checkin = mongoose.model('Checkin');
var fs = require('fs');
var wstream = fs.createWriteStream('myOutput.txt');

mongoose.connect('mongodb://localhost/twyst');
main();
function main() {
	Voucher.find({
		'basics.modified_at': {
			$gt: new Date(2014, 8, 1)
		}
	})
	.populate('issue_details.issued_to')
	.exec(function (err, vouchers) {
		var length = vouchers.length;
		console.log(err || vouchers.length);
		vouchers.forEach(function (v) {
			if(v.issue_details.issued_to) {
				findCheckins(v, function (err, checkin) {
					if(err) {
						wstream.write("Checkin(err) not found: "+v.basics.code+'\n');
						console.log("Checkin(err) not found: "+v.basics.code);
					}
					else {
						if(!checkin) {
							wstream.write("Checkin not found:  "+v.basics.code+'\n');
							console.log("Checkin not found: "+v.basics.code);
						}
						else {
							v.checkin_details = {};
							v.checkin_details.checkin_id = checkin._id;
							v.checkin_details.batch = (checkin.checkin_type === 'BATCH') ? true : false;
							v.save(function (err, vo) {
								console.log(err || vo.basics.code);
							})
							wstream.write("Checkin found: "+v.basics.code+' Checkin ID:' + checkin._id + '\n');
							console.log("Checkin found: "+v.basics.code+' Checkin ID:' + checkin._id + '\n')
						}
					}
					if(--length === 0) {
						wstream.end();
						return;
					}
				});
			}
			else {
				wstream.write("No user for: "+v.basics.code+'\n');
				console.log("No user for: "+v.basics.code);
				if(--length === 0) {
					wstream.end();
					return;
				}
			}
		})
	})
}

function findCheckins(v, cb) {
	Checkin.findOne({
		phone: v.issue_details.issued_to.phone,
		modified_date: {
			$gt: new Date(new Date(v.basics.modified_at).getTime() - 60000),
			$lt: new Date(new Date(v.basics.modified_at).getTime() + 60000)
		},
		outlet: {
			$in: v.issue_details.issued_at
		}
	}, function (err, checkin) {
		cb(err, checkin);
	})
}
