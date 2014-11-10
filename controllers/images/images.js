var AWS = require('aws-sdk'),
	fs = require('fs'),
	UUID = require('node-uuid'),
	Settings = require('../../config/settings');

AWS.config.update(Settings.values.aws_config);

module.exports.upload = function(req, res) {
	
  	var image_path = req.files.file.path,
  		key = UUID.v4(),
  		bucket = 'twyst-outlets',
  		ContentType = req.files.file.mimetype;

  	if(!image_path || !key || !ContentType) {
  		res.send(400,{
	        'status': 'error',
	        'message': 'Not a valid image file',
	        'info': null
	    })
  	}
  	else {
  		var upload_object = {
		    ACL : 'public-read',
		    Bucket: bucket,
		    ContentType: ContentType,
		    Key: key,
		    Body: fs.readFileSync(image_path)
	  	}

	  	uploader(upload_object, function (err, data) {
	  		if(err) {
	  			res.send(400,{
			        'status': 'error',
			        'message': 'Error uploading the image',
			        'info': err
			    })
	  		}
	  		else {
	  			data = data || {};
	  			data.key = key;
	  			res.send(200,{
		    		'status': 'success',
		    		'message': 'image uploaded successfully',
		    		'info': data
		    	})
	  		}
	  	})
  	}
}

function uploader(upload_object, cb) {
	var s3 = new AWS.S3();
	s3.client.putObject(upload_object, function (err, data) {
	    cb(err, data)
  	});
}

module.exports.delete = function(req, res) {
	var key = req.query.key,
  		bucket = 'twyst-outlets';

  	if(!key) {
  		res.send(400,{
	        'status': 'error',
	        'message': 'Request is incomplete',
	        'info': null
	    })
  	}
  	else {
  		var delete_object = {
		    Bucket: bucket,
		    Key: key
	  	}

	  	deleter(delete_object, function (err, data) {
	  		if(err) {
	  			res.send(400,{
			        'status': 'error',
			        'message': 'Error deleting the image',
			        'info': err
			    })
	  		}
	  		else {
	  			data = data || {};
	  			data.key = key;
	  			res.send(200,{
		    		'status': 'success',
		    		'message': 'image deleted successfully',
		    		'info': data
		    	})
	  		}
	  	})
  	}
}

function deleter(delete_object, cb) {
	var s3 = new AWS.S3();
	s3.client.deleteObject(delete_object, function (err, data) {
	    cb(err, data)
  	});
}