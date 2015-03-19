var csv = require('csv');
var fs = require("fs");
var account = require('../../models/account.js');

var mongoose = require('mongoose');
var Account = mongoose.model('Account');

mongoose.connect('mongodb://localhost/twyst');

csv()
	.from.stream(fs.createReadStream(__dirname + '/birthdays2.csv', { encoding: 'utf8' }))
	.on('record', function (row, index) {
	    if (index > 0) {
	    	Account.findOne({phone:row[8]}, function(e,a) {
	    	if (e) {
	    		console.log("ERROR " + e);
	    	} else {
	    		if (!a) {
	    			console.log("ERROR: Account not found: " + row[8]);
	    		} else {
	    			console.log("Saving")
	    			a.profile.bday.y = row[7];
	    			a.profile.bday.m = row[6];
	    			a.profile.bday.d = row[5];
	    			a.profile.first_name = row[1] || '';
	    			a.profile.last_name = row[3] || '';
	    			a.profile.email = row[4] || '';
	    			a.save(function(s, err) {
	    				// console.log(s);
	    				// console.log(err);
	    			});
	    		}
	    		// console.log(a);
	    	}
	    })
	    }

	})
	.on('end', function (count) {
		console.log("Finished reading the CSV file")
	})
