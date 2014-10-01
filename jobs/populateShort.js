var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('../config/config_models')();
var csv = require('csv');
var fs = require("fs");
var Outlet = mongoose.model('Outlet');
mongoose.connect('mongodb://localhost/twyst');

csv()
.from.stream(fs.createReadStream(__dirname + '/urls.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index > 0) {
    	var id = row[0];
        var z = row[3];
		populateUrls(id, z);
    }
})
.on('end', function (count) {
	console.log("I am finished.")
})

function populateUrls(id, z) {
	Outlet.findOne({_id: id}, function (err, outlet) {
		outlet.shortUrl = [];
		outlet.shortUrl.push(z);
		outlet.save(function (err) {
			console.log(err || "success");
		})
	})
}