var csv = require('csv'),
	fs = require("fs"),
	async = require('async'),
	mongoose = require('mongoose');

require('../config/config_models')();
mongoose.connect('mongodb://localhost/twyst');
var Account = mongoose.model('Account');
readCsv(0);

var data = [],
	germ_count = 0;
function readCsv(data_index) {
	csv()
	.from.stream(fs.createReadStream(__dirname + '/bday_db.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {
		var profile = {
			first_name: row[1] || '',
			middle_name: row[2] || '',
			last_name: row[3] || '',
			phone: row[4] || null,
			bday: {
				d: row[5] || '',
				m: row[6] || '',
				y: row[7] || ''
			},
			email: row[8] || ''
		}
		if(profile.phone) {
			data.push(profile);
		}
	})
	.on('end', function (count) {
		console.log(count);
		populateProfile(data);
		data.forEach(function (d) {
			
		});
	})
}

function populateProfile(data) {
	async.each(data, function (profile, callback) {
		setProfile(profile, function (err, user) {
			if(err) {
				callback(err);
			}
			callback();
		});
	}, function (err) {
		console.log(germ_count);
		if(err) {
			console.log(err);
		}
		else {
			console.log("Success");
		}
	})
}

function setProfile(profile, cb) {
	Account.findOne({
		phone: profile.phone
	})
	.exec(function (err, user) {
		if(err) {
			cb(err);
		}
		else {
			if(!user) {
				++germ_count;
				console.log("User not found " + profile.phone);
				cb(null, null);
			}
			else {
				console.log("User found " + profile.phone);
				user.profile = profile;
				user.save(function (err) {
					if(err) {
						cb(err);
					}
					else {
						cb(null, user);
					}
				})
			}
		}
	})
}