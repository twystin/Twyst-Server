var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('../config/config_models')();
var csv = require('csv');
var fs = require("fs");
var Outlet = mongoose.model('Outlet');
mongoose.connect('mongodb://localhost/twyst');

csv()
.from.stream(fs.createReadStream(__dirname + '/sms_off_time.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index > 0) {
    	var id = row[0];
    	var value = row[4];
    	var start = Math.floor(row[5] / 100) * 60 + (row[5] % 100);
    	var end = Math.floor(row[6] / 100) * 60 + (row[6] % 100);
        var sms_off = {
        	value: value,
        	time: {
        		start: start,
        		end: end
        	}
        };
		populateSmsOff(id, sms_off);
    }
})
.on('end', function (count) {
	console.log("I am finished.")
})

function populateSmsOff(id, sms_off) {
	Outlet.findOne({_id: id}, function (err, outlet) {
		if(outlet) {
			outlet.sms_off = sms_off;
			outlet.save(function (err) {
				console.log(err || "success");
			})
		}
	})
}