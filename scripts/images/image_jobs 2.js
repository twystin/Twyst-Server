var recursive = require('recursive-readdir'),
	AWS = require('aws-sdk'),
	fs = require('fs'),
	im = require('imagemagick'),
	async = require('async'),
	mongoose = require('mongoose'),
	Settings = require('../config/settings');

AWS.config.update(Settings.values.aws_config);
require('../config/config_models')();
mongoose.connect('mongodb://50.112.253.131/twyst');
var Outlet = mongoose.model('Outlet');

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

function uploader(upload_object, cb) {
	var s3 = new AWS.S3();
	s3.putObject(upload_object, function (err, data) {
	    console.log(err || data)
	    cb(err, data)
  	});
}
main();
function main() {
	var slug = "zaikapunjabi";
	recursiveReader(slug, function (files) {
		console.log(files)
		async.each(files, function (f, callback) {
			splited_file = f.split('\\');
			var slug = splited_file[2]
			if(splited_file[3] === 'logo.png') {
				readOutlet(slug, function (outlets) {
					async.each(outlets, function (o, cb) {
						var image_object = getImageObject('logo', f, o);
						uploader(image_object, function (err, s) {
							saveOutlet(o._id, 'logo', 'logo');
							cb();
						})
					}, function (err){
						console.log(err);
						if(!err) {
							console.log("Image uploaded");
						}
						callback();
					});
				})
			}
			else if(splited_file[3] === 'logo1.png') {
				readOutlet(slug, function (outlets) {
					async.each(outlets, function (o, cb) {
						var image_object = getImageObject('logo_gray', f, o);
						uploader(image_object, function (err, s) {
							saveOutlet(o._id, 'logo_gray', 'logo_gray')
							cb();
						})
					}, function (err){
						console.log(err);
						if(!err) {
							console.log("Image uploaded");
						}
						callback();
					});
				})
			}
			else if(splited_file[3] === 'Background.png') {
				readOutlet(slug, function (outlets) {
					async.each(outlets, function (o, cb) {
						var image_object = getImageObject('background', f, o);
						uploader(image_object, function (err, s) {
							saveOutlet(o._id, 'background', 'background');
							cb();
						})
					}, function (err){
						console.log(err);
						if(!err) {
							console.log("Image uploaded");
						}
						callback();
					});
				})
			}
			else {
				if(getFilesizeInBytes(f) < 14) {
					console.log(getFilesizeInBytes(f))
					readOutlet(slug, function (outlets) {
						async.each(outlets, function (o, callback) {
							asyncUploader(f, o, function (image_save_object) {
								saveOutlet(o._id, 'others', image_save_object);
								callback();
							});
						}, function (err){
							console.log(err);
							if(!err) {
								console.log("Image uploaded");
							}
							callback();
						});
					})
				}
			}
		}, function (err) {
			console.log("I am done now :)");
		})
	});
}

function asyncUploader(f, outlet, cb) {
	var time = Date.now();
	var image_save_object = {
        _th: {type: String, default: '', trim: ''},
        _sm: {type: String, default: '', trim: ''},
        _md: {type: String, default: '', trim: ''},
        _lg: {type: String, default: '', trim: ''}
    }
	async.each(dimensions, function (d, callback) {
		resizer(f, d, function (err, data) {
			if(err) {
				callback(null, null);
			}
			else {
				var image_name = time + d.size;
				var image_object = getImageObject(null, null, outlet, image_name, data);
				uploader(image_object, function (err, s) {
					image_save_object[d.size] = image_name;
					callback(null, data);
				})
			}
		})
	}, function (err) {
		console.log(err || "completed");
		cb(image_save_object);
	})
}

function getImageObject(type, image_path, outlet, image_name, image_data) {
        var imageObject = {
        	ACL : 'public-read',
            Bucket : "twyst-outlets/"+ outlet._id,
            ContentType: 'image/png',
            Key: type ? type : image_name,
            Body: image_path ? fs.readFileSync(image_path) : image_data
        };
        imageObject.Bucket = imageObject.Bucket.replace(/[^a-zA-Z0-9-\/]/g,'-')
        return imageObject;
    }

function recursiveReader(slug, cb) {
	recursive('E:/merchants/' + slug, function (err, files) {
		cb(files);
	})
}

function readOutlet(slug, cb) {
	Outlet.find({
		'basics.slug': slug
	}, function (err, outlets) {
		cb(outlets);
	})
}

function saveOutlet(id, type, url) {
	Outlet.findOne({
		_id: id
	}, function (err, outlet) {
		if(JSON.stringify(outlet.photos)[0] === '[') {
            delete outlet.photos;
            outlet.photos = {};
        }
        if(type === 'others') {
        	var image = {
        		image: url,
        		title: outlet.basics.name + ' image',
        		approved: true
        	}
        	outlet.photos.others.push(image);
        }
        else {
        	outlet.photos[type] = url
        }
		console.log(outlet.photos)
		outlet.save(function (err) {
			console.log("Saved")
		})
	})
}

function resizer(image_path, dimension, cb) {
	getResizeObject(image_path, dimension, function (err, resize_object) {
		if(err) {
			cb(err, null);
		}
		else {
			im.resize(resize_object, function(err, stdout, stderr){
				var image_buffer = new Buffer(stdout, "binary");
				cb(err, image_buffer);
			});
		}
	});
}

function getResizeObject(image_path, dimension, cb) {
	im.identify(image_path, function(err, features){
	  	if (err) {
	  		cb(err, null);
	  	}
	  	else {
	  		var image_resize_object = {
		  		srcPath: image_path,
				quality: 0.8
		  	};
			if(features.width > features.height) {
				image_resize_object.width = dimension.width;
			}
			else {
				image_resize_object.height = dimension.height;
			}
			console.log(image_resize_object)
			cb(err, image_resize_object);
	  	}
	});
}

function getFilesizeInBytes(filename) {
	var stats = fs.statSync(filename);
	var fileSizeInMB = stats["size"];
	return fileSizeInMB / 1000000.0;
}
