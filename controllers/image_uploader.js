var AWS = require('aws-sdk');
var fs = require('fs');
var _ = require('underscore');
var keygen = require("keygenerator");

AWS.config.update({
  region: 'us-west-2',
  accessKeyId: 'AKIAJTAQ7XF55TQMK5FA',
  secretAccessKey: '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'
});

var bucket = "twystmerchant";

module.exports.upload = function(req, res) {
  var image_path = req.files.file.path;
  var s3 = new AWS.S3();
  var key = keygen._();
  s3.client.putObject({
    ACL : 'public-read',
    Bucket: bucket,
    ContentType: 'image/jpg',
    Key: key,
    Body: fs.readFileSync(image_path)
  }, function(err) {
    if(err) {
    	res.send(400,{
        'status': 'error',
        'message': 'Error uploading the image',
        'info': JSON.stringify(err)
      })
    }
    else {
    	var image_access_url = "https://s3-us-west-2.amazonaws.com/"+bucket+"/"+key;
    	console.log(image_access_url);
      res.send(200,{
    		'status': 'success',
    		'message': 'image uploaded successfully',
    		'info': JSON.stringify(image_access_url)
    	})
    }
  });
}