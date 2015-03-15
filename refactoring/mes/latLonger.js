require('../../config/config_models')();
var mongoose = require('mongoose');
var _ = require("underscore");
var Loc = mongoose.model('UserLoc');
var fs = require('fs');
var wstream = fs.createWriteStream('myOutput.txt');

mongoose.connect('mongodb://50.112.253.131/twyst');
main();
function main() {
	Loc.aggregate(
		{$unwind:"$locations"},
		{$group:{_id:null, clrs: {$push : "$locations"} }}, function (err, result) {
			var results = _.uniq(result[0].clrs, function (r) {
				return r.latitude + '' + r.longitude;
			})
			wstream.write(JSON.stringify(results))
			console.log(err || JSON.stringify(result[0].clrs));
			wstream.end();
	})
}
