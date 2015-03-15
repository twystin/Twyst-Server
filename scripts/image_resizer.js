var recursive = require('recursive-readdir'),
	im = require('imagemagick'),
	async = require('async'),
	mkdirp = require('mkdirp'),
	fs = require('fs');

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

main();
function main() {
	var slug = "";
	recursiveReader(slug, function (files) {
		console.log(files)
		async.each(files, function (f, cb) {
			splited_file = f.split('\\');
			var slug = splited_file[2]
			if(splited_file[3] === 'logo.png') {
				
			}
			else if(splited_file[3] === 'logo1.png') {
				
			}
			else if(splited_file[3] === 'Background.png') {
				
			}
			else {
				if(getFilesizeInBytes(f) < 11) {
					var image_name = slug + '/' + Date.now();
					async.each(dimensions, function (d, callback) {
						resizer(f, image_name, d, function (err, data) {
							if(err) {
								callback(null, null);
							}
							else {
								
							}
						})
					}, function (err) {
						console.log(err || "completed");
						cb();
					})
				}
			}
		}, function (err) {
			console.log("I am done now :)");
		})
	});
}

function getFilesizeInBytes(filename) {
	var stats = fs.statSync(filename);
	var fileSizeInMB = stats["size"];
	return fileSizeInMB / 1000000.0;
}

function resizer(image_path, image_name, dimension, cb) {
	getResizeObject(image_path, image_name, dimension, function (err, resize_object) {
		if(err) {
			cb(err, null);
		}
		else {
			im.resize(resize_object, function(err, stdout, stderr){
				var image_buffer = new Buffer(stdout, "binary");
				var path = "E:/merchants1/" + image_name + '/';
				mkdirp(path, function (err) {
				    if (err) console.error(err)
				    else {
				    	var name = dimension.size + '.png';
				    	fs.writeFile(path + name, image_buffer, function (err, st) {
							console.log(err || st)
						})
				    }
				});
				cb(err, image_buffer);
			});
		}
	});
}

function getResizeObject(image_path, image_name, dimension, cb) {
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

function recursiveReader(slug, cb) {
	recursive('E:/merchants/' + slug, function (err, files) {
		cb(files);
	})
}