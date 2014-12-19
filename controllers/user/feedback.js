var mongoose = require('mongoose');
var async = require('async');
var Feedback = mongoose.model('Feedback'),
	Checkin = mongoose.model('Checkin'),
	Outlet = mongoose.model('Outlet'),
	Account = mongoose.model('Account'),
	Images = require('../../modules/images/image');
 
module.exports.save = function(req, res) {
	var feedback = {
		'outlet': req.body.outlet,
		'comment': req.body.comment,
		'type': req.body.type,
		'photo': req.body.photo,
		'photo_type': req.body.photo_type
	};

	if (validateFeedback(feedback)) {
		handleFeedback();
	} else {
		res.send(400, {
			'status': 'error',
			'message': 'Error saving feedback',
			'info': null
		})
	}

	function handleFeedback() {
		if (feedback.photo) {
			feedback.photo = decodeBase64Image(feedback.photo);
			feedback.photo_type = feedback.photo_type || 'image/jpeg';
			var bucketName = 'twyst-feedbacks',
				image_name = feedback.outlet + '/' + req.user._id + '_' + Date.now(),
				upload_object = getUploadObject(
					bucketName,
					feedback.photo_type,
					image_name,
					feedback.photo
				);
			Images.uploader(upload_object, function(err, data) {
				if (err) {
					res.send(400, {
						'status': 'error',
						'message': 'Error uploading the image',
						'info': err
					})
				} else {
					save(image_name);
				}
			})
		} else {
			save(null);
		}
	}

	function decodeBase64Image(dataString) {
		return (new Buffer(dataString, 'base64'));
	}

	function save(image_name) {
		var feedback_obj = {
			'outlet': feedback.outlet,
			'account': req.user._id,
			'feedback': {
				'comment': feedback.comment,
				'photo': image_name,
				'type': feedback.type
			}
		};
		feedback_obj = new Feedback(feedback_obj);
		feedback_obj.save(function(err) {
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error saving the feedback',
					'info': err
				})
			} else {
				initEmail(req.user, feedback_obj);
				res.send(200, {
					'status': 'success',
					'message': 'Saved the feedback',
					'info': null
				});
			}
		})
	}
}

function getUploadObject(bucketName, ContentType, image_name, image_data) {
	return upload_object = {
		ACL: 'public-read',
		Bucket: bucketName,
		ContentType: ContentType,
		Key: image_name,
		Body: image_data
	}
}

function validateFeedback(feedback) {
	if (!feedback.type 
		&& !feedback.outlet 
		&& !(feedback.photo 
			|| feedback.comment)) {
		return false;
	}
	return true;
}

function initEmail(user, feedback_obj) {
	
}