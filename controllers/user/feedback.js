var mongoose = require('mongoose');
var async = require('async');
var Feedback = mongoose.model('Feedback'),
	Checkin = mongoose.model('Checkin'),
	Outlet = mongoose.model('Outlet'),
	Account = mongoose.model('Account'),
	Images = require('../../modules/images/image'),
	MailSender = require('../../common/sendMail'),
	Handlebars = require('handlebars'),
	fs = require('fs')

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
				res.send(200, {
					'status': 'success',
					'message': 'Saved the feedback',
					'info': null
				});
				parallelExecutor()
			}
		})
	}

	function parallelExecutor() {
		async.parallel({
			OUTLET_CHECKINS: function(callback) {
				getOutletCheckins(callback);
			},
			ACROSS_OUTLETS_CHECKINS: function(callback) {
				getAcrossOutletsCheckins(callback);
			},
			USER_DETAILS: function(callback) {
				getUserDetails(callback);
			},
			OUTLET_DETAILS: function(callback) {
				getOutletDetails(callback);
			}
		}, function(err, results) {
			//console.log(results);
			var outlet = results.OUTLET_DETAILS;
			var user = results.USER_DETAILS;
			
			
			var emailHTML = '';
			fs.readFile('/home/rishi/Desktop/Twyst/Twyst-Server/templates/feedback-email.handlebars', 'utf8', function (err, templateHB) {
			  if (err) {
			    console.log("err is ",err);
			  }
			  
			console.log("templateHB is ", templateHB);
			
			var template = Handlebars.compile(templateHB);
			
			console.log("template is ", template);
			var data = {
				"owner_name": outlet.basics.contact_person_name,
				"outlet_name": outlet.basics.name,
				"outlet_location": outlet.contact.location.locality_1[0],
				"feedback_comment":feedback.comment,
				"user_email": user.email,
				"user_phone": user.phone,
				"outlet_checkins": results.OUTLET_CHECKINS,
				"across_outlet_checkins": results.ACROSS_OUTLETS_CHECKINS
			};

			var result = template(data);
			//var msg = '<html><body><p>Hi '+ outlet.basics.contact_person_name +'</p><p>You have got a new feedback your outlet '+ outlet.basics.name +', '+outlet.contact.location.locality_1[0] +'<br/><h3>User Details:</h3><ol type="1"><li>Email: '+ user.email +'</li><li>Phone: '+ req.body.phone +'</li><li>Total Checkins at '+ outlet.basics.name +', '+outlet.contact.location.locality_1[0] +' : '+ results.OUTLET_CHECKINS +'</li><li>Total Checkins at your all outlets: '+ results.ACROSS_OUTLETS_CHECKINS +'</li></ol><h4>Feedback Details:</h4><ol type="1"><li>Type: '+ feedback.type +'</li><li>Comments: '+ feedback.comment +'</li></ol>Please find pics if any in attachments.</p><a href="mailto:'+ user.email +'?subject=Reply to feedback on Twyst&cc=contactus@twyst.in">Click here to reply to Customer</a><p>Thank you,<br/>Team Twyst</p><img src="http://twyst.in/home/assets/img/twyst_logo_2.png"></body></html>';
			var mailOptions = {
				from: 'Jayram Singh <jayram@twyst.in>',
				to: 'Rishi <rishi@twyst.in>',
				//to: '<'+results.OUTLET_DETAILS.contact.emails.email+'>',
				//cc:  'Contact Us <contactus@twyst.in>',
				subject: 'Sample Feedback Email',
				text: 'Feedback Email',
				html: result
				//type: feedback.type
				/*attachments: [{
					filename: 'Feedback_Photo_1.jpeg',
					content: 'https://s3-us-west-2.amazonaws.com/twyst-feedbacks/' + feedback.photo
				}]*/	
			}
			MailSender.optionMailer(mailOptions);
			});			
		});
	}

	function getOutletCheckins(callback) {
		Checkin.count({
			phone: req.user.phone,
			outlet: req.body.outlet
		}, function(err, count) {
			//console.log("count is ", count);
			callback(null, count || 0);
		})
	}

	function getAcrossOutletsCheckins(callback) {
		Outlet.findOne({
			_id: req.body.outlet
		}, function(err, outlet) {
			Account.findOne({
				role: 3,
				_id: {
					$in: outlet.outlet_meta.accounts
				}
			}, function(err, account) {
				Outlet.find({
					'outlet_meta.accounts': account._id
				}, function(err, outlets) {
					Checkin.count({
						phone: req.user.phone,
						outlet: {
							$in: outlets.map(
								function(outlet) {
									return mongoose.Types.ObjectId(String(outlet._id));
								})
						}
					}, function(err, checkins) {
						//console.log("Total count is ", checkins);
						callback(null, checkins || 0);
					})
				})
			})
		})
	}

	function getOutletDetails(callback) {
		Outlet.findOne({
			_id: req.body.outlet
		}, function(err, outlet) {
			callback(null, outlet || null);
		})
	}

	function getUserDetails(callback) {
		Account.findOne({
			_id: req.user._id
		}, function(err, user) {
			callback(null, user || null);
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
	if (!feedback.type && !feedback.outlet && !(feedback.photo || comment)) {
		return false;
	}
	return true;
}