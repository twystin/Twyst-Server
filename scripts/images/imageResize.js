var im = require('imagemagick'),
	async = require('async'),
	fs = require('fs');

var dimensions = [
	{
		size: '_xs',
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

var image_path = 'coopersgrillbar1.png';

async.each(dimensions, function (d, callback) {
	resizer(image_path, d, function (err, data) {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, data);
		}
	})
}, function (err) {
	console.log(err || "completed");
})

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