var im = require('imagemagick'),
	async = require('async'),
	fs = require('fs');

module.exports.main = function (image_path, dimensions, cb) {
	var images = [];
	async.each(dimensions, function (d, callback) {
		resizer(image_path, d, function (err, data) {
			if(err) {
				callback(err);
			}
			else {
				var image = {
					name: d.size,
					data: data
				};
				images.push(image);
				callback();
			}
		})
	}, function (err) {
		cb(err, images);
	});
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
			cb(err, image_resize_object);
	  	}
	});
}