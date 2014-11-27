var mongoose = require('mongoose');
var Feedback = mongoose.model('Feedback'),
	Images = require('../../modules/images/image'),
	MailSender = require('../../common/sendMail');

module.exports.save = function(req, res) {
	var feedback = {
		'outlet': req.body.outlet,
		'comment': req.body.comment,
		'type': req.body.type,
		'photo': req.body.photo,
		'photo_type': req.body.photo_type
	};

	if(validateFeedback(feedback)) {
		handleFeedback();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message' : 'Error saving feedback',
			'info': null
		})
	}

	function handleFeedback() {
		console.log(feedback.photo)
		console.log(typeof feedback.photo)
		if(feedback.photo) {
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
			Images.uploader(upload_object, function (err, data) {
		  		if(err) {
		  			res.send(400,{
				        'status': 'error',
				        'message': 'Error uploading the image',
				        'info': err
				    })
		  		}
		  		else {
		  			save(image_name);
		  		}
		  	})
		}
		else {
			save(null);
		}
	}

	function decodeBase64Image(dataString) {
		dataString = "data:image/jpeg;base64" + dataString;
		var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
		response = {};

		response.type = matches[1];
		response.data = new Buffer(matches[2], 'base64');

		return response;
	}

	function save (image_name) {
		var feedback_obj = {
			'outlet': feedback.outlet,
			'account': req.user._id,
			'feedback': {
				'comment': feedback.comment,
				'photo': image_name,
				'type': feedback.type
			}
		};
		console.log(feedback_obj)
		feedback_obj = new Feedback(feedback_obj);
		feedback_obj.save(function (err) {
			if(err) {
				res.send(400,{
			        'status': 'error',
			        'message': 'Error saving the feedback',
			        'info': err
			    })
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Saved the feedback',
					'info': null
				});
				var to ='<jayram.chandan@gmail.com>, <ar@twyst.in>';
				var sbj = 'Feedback email';
				var f = '';
				f += '\nPhone: ' + (req.user.phone || '');
				f += '\nOutlet: ' + feedback.outlet;
				f += '\nComment: ' + (feedback.comment || '');
				f += '\nType: ' + feedback.type;
				f += '\nPhoto: ' + (feedback_obj.feedback.photo || ''); 
				MailSender.mailer(to, f, sbj);
			}
		})
	}
}

function getUploadObject(bucketName, ContentType, image_name, image_data) {
	return upload_object = {
	    ACL : 'public-read',
	    Bucket: bucketName,
	    ContentType: ContentType,
	    Key: image_name,
	    Body: image_data
  	}
}

function validateFeedback(feedback) {
	if(!feedback.type
		&& !feedback.outlet
		&& !(feedback.photo || comment)) {
		return false;
	}
	return true;
}