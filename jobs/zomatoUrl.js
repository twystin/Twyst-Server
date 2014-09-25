var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('../config/config_models')();
var csv = require('csv');
var fs = require("fs");
var Outlet = mongoose.model('Outlet');
mongoose.connect('mongodb://staging.twyst.in/twyst');

csv()
.from.stream(fs.createReadStream(__dirname + '/urls.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index > 0) {
    	var id = row[0];
        var z = row[4];
        var f = row[5]
		populateUrls(id, z, f);
    }
})
.on('end', function (count) {
	console.log("I am finished.")
})

function populateUrls(id, z, f) {
	Outlet.findOne({_id: id}, function (err, outlet) {
		outlet.links.zomato_url = z;
		outlet.links.foodpanda_url = f;
		outlet.save(function (err) {
			console.log(err || "success");
		})
	})
}