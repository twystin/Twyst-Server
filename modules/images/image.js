var recursive = require('recursive-readdir'),
	//im = require('imagemagick'),
	async = require('async'),
	fs = require('fs'),
	AWS = require('aws-sdk'),
	Settings = require('../../config/settings'),
	FileType = require('./fileType').ext;

AWS.config.update(Settings.values.aws_config);
var s3 = new AWS.S3();

// Function to check if the image file is supported
// takes the image path as the parameters
// returns true or false

module.exports.isSupportedImage = function(content_type) {
	if(content_type === "image/jpeg"
		|| content_type === "image/png") {
		return true;
	}
	return false;
}

// Function to delete file on s3
// takes the upload object and callback as the parameters
// returns callback with error or upload data

module.exports.deleter = function(delete_object, cb) {
	s3.client.deleteObjects(delete_object, function (err, data) {
	    cb(err, data)
  	});
}

// Function to upload file on s3
// takes the upload object and callback as the parameters
// returns callback with error or upload data

module.exports.uploader = function(upload_object, cb) {
	s3.client.putObject(upload_object, function (err, data) {
	    cb(err, data)
  	});
}

// Common module to read any file
// params {path to the image to read, callback}
// Returns error or file(read data in buffer)
module.exports.readImage = function (image_path, cb) {
    fs.readFile(image_path, function (err, file_data) {
        cb(err, file_data);
    })
}

// Function to compute file size in node.js
// takes the file path and callback as the parameters
// returns callback with error or the fle size in MB

module.exports.getFilesizeInMb = function (image_path, cb) {
	fs.stat(image_path, function (err, stats) {
		if(err) {
			cb(err, 0);
		}
		else {
			var fileSizeInMB = stats["size"];
			cb(null, fileSizeInMB / 1000000.0);
		}
	});
}