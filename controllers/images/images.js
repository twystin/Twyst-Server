var AWS = require('aws-sdk'),
	fs = require('fs'),
	async = require('async'),
	Settings = require('../../config/settings'),
	Images = require('../../modules/images/image'),
	Resizer = require('../../modules/images/resizer');

AWS.config.update(Settings.values.aws_config);

var image_sizes = {
	'logo': 0.2,
	'logo_gray': 0.2,
	'background': 1.0,
	'others': 5.0
};

var dimensions = [
	{
		size: '_th',
		width: 256,
		height: 256
	},
	{
		size: '_sm',
		width: 640,
		height: 480
	},
	{
		size: '_md',
		width: 1024,
		height: 768
	},
	{
		size: '_lg',
		width: 1280,
		height: 1024
	}
];

module.exports.upload = function(req, res) {
	
  	var img_obj = {
  		image_path: req.files.file.path,
  		image_for: req.body.image_for,
  		image_class: req.body.image_class,
  		ContentType: req.files.file.mimetype,
  		folder_name: req.body.folder_name,
  		bucketName: req.body.bucketName
  	};

  	var err = imageValidator(img_obj);
  	if(err) {
  		res.send(400, {
	        'status': 'error',
	        'message': err,
	        'info': err
	    })
  	}
  	else {
  		Images.getFilesizeInMb(img_obj.image_path, function (err, file_size) {
			if(err) {
				res.send(400, {
			        'status': 'error',
			        'message': 'Image path is not valid',
			        'info': err
			    })
			}
			else {
				if(img_obj.image_for === 'outlet') {
					if(!image_sizes[img_obj.image_class] 
						|| image_sizes[img_obj.image_class] <= file_size) {
						res.send(400, {
					        'status': 'error',
					        'message': 'Image size must not exceed ' + image_sizes[img_obj.image_class] + ' mb',
					        'info': null
					    })
					}
					else {
						if(img_obj.image_class === 'others') {
							outletOtherImagesHandler();
						}
						else {
							outletImagesHandler();
						}
					}
				}
				else {
					res.send(400, {
				        'status': 'error',
				        'message': 'Only outlet images allowed currently',
				        'info': null
				    })
				}
			}
		});
  	}

  	function outletImagesHandler() {
		Images.readImage(img_obj.image_path, function (err, image_data) {
			if(err) {
				res.send(400,{
			        'status': 'error',
			        'message': 'Error reading the image content',
			        'info': err
			    })
			}
			else {
				var upload_object = getUploadObject(
					img_obj, 
					img_obj.folder_name + '/' + img_obj.image_class,
					image_data
				);
			  	Images.uploader(upload_object, function (err, data) {
			  		if(err) {
			  			res.send(400,{
					        'status': 'error',
					        'message': 'Error uploading the image',
					        'info': err
					    })
			  		}
			  		else {
			  			data = data || {};
			  			data.key = img_obj.image_class;
			  			res.send(200,{
				    		'status': 'success',
				    		'message': 'image uploaded successfully',
				    		'info': data
				    	})
			  		}
			  	})
			}
		});
	}

	function outletOtherImagesHandler() {
		Resizer.main(img_obj.image_path, dimensions, function (err, images) {
			if(err) {
				res.send(400, {
			        'status': 'error',
			        'message': 'Image resize error',
			        'info': err
			    });
			}
			else {
				var key = {};
				var date = Date.now();
				async.each(images, function (i, callback) {
					var upload_object = getUploadObject(
						img_obj, 
						img_obj.folder_name + '/' + date + i.name,
						i.data
					);
					Images.uploader(upload_object, function (err, data) {
				  		if(err) {
				  			callback(err);
				  		}
				  		else {
				  			key[i.name] = date + i.name;
				  			callback();
				  		}
				  	})
				}, function (err) {
					if(err) {
						res.send(400, {
					        'status': 'error',
					        'message': 'Image upload error',
					        'info': err
					    });
					}
					else {
						var data = {};
			  			data.key = key;
			  			res.send(200,{
				    		'status': 'success',
				    		'message': 'image uploaded successfully',
				    		'info': data
				    	})
					}
				});
			}
		})
	}
}

function getUploadObject(img_obj, image_name, image_data) {
	return upload_object = {
	    ACL : 'public-read',
	    Bucket: img_obj.bucketName,
	    ContentType: img_obj.ContentType,
	    Key: image_name,
	    Body: image_data
  	}
}

function imageValidator(img_obj) {
  	if(!img_obj.image_path) {
  		return 'No valid image path';
  	}
  	if(!img_obj.folder_name) {
  		return 'No valid folder name';
  	}
  	if(!img_obj.image_for) {
  		return 'No valid image for';
  	}
  	if(!img_obj.image_class) {
  		return 'No valid image class';
  	}
  	if(!Images.isSupportedImage(img_obj.ContentType)) {
  		return 'No valid image type';
  	}
  	return null;
}

module.exports.delete = function(req, res) {
	var key = req.query.key,
  		bucket = req.query.bucket;

  	if(!key || !bucket) {
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