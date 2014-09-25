var _ = require('underscore');

var csv = require('csv');
var fs = require('fs');
var AWS = require("aws-sdk");
AWS.config.update({
  region: 'us-west-2',
  accessKeyId: 'AKIAJTAQ7XF55TQMK5FA',
  secretAccessKey: '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'
});

var bucket = "twystmerchantpages/merchants";
var slugs = [];

csv()
.from.stream(fs.createReadStream(__dirname + '/slugs.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index > 0) {
        var slug = row[0];
		slugs.push(slug);
    }
})
.on('end', function (count) {
	console.log(slugs)
    //createFolders();
})
.on('error', function (error) {
    console.log(error.message);
});

function createFolders() {
	var s3 = new AWS.S3();
	slugs.forEach(function (slug) {
		s3.client.createBucket({Bucket: bucket+"/"+slug+"/"}, function (err, result) {
			console.log(err || result);
		})
	})
}