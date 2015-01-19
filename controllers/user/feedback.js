var mongoose = require('mongoose');
var async = require('async');
var Feedback = mongoose.model('Feedback'),
	Checkin = mongoose.model('Checkin'),
	Outlet = mongoose.model('Outlet'),
	Account = mongoose.model('Account'),
	Images = require('../../modules/images/image'),
	Mailer = require('../mailer/mailer');
 
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
	var obj = {
		to: null,
		data: {
			merchant_name: null,
			merchant_id: null,
			outlet_name: null,
			outlet_location: null,
			user_email: getUserEmail(user),
			user_phone: user.phone,
			checkins: {
				here: 0,
				all: 0
			},
			comment: feedback_obj.feedback.comment
		},
		type: 'FEEDBACK',
		photo_url: null,		
	};
	if(feedback_obj.feedback.photo) {
		obj.photo_url = 'https://s3-us-west-2.amazonaws.com/twyst-feedbacks/' + feedback_obj.feedback.photo;
	}

	getMerchantInfo (feedback_obj.outlet, function (err, data) {
		if(err) {
			console.log(err);
		}
		else {
			if(!data) {
				console.log("Do nothing");
			}
			else {
				obj.data.outlet_name = data.outlet_name;
				obj.data.merchant_name = data.merchant_name;
				obj.data.merchant_id = data.merchant_id;
				obj.data.outlet_location = data.outlet_location;
				obj.to = data.merchant_email;
				getUserCheckinInfo(user, data, function (err, checkins) {
					if(err) {
						console.log(err);
					}
					obj.data.checkins = checkins;
					Mailer.sendEmail(obj);
				})
			}
		}
	});
}

function getUserCheckinInfo(user, info_obj, cb) {
	var data = {
		here: 0,
		all: 0
	}
	getOutlets({
		'outlet_meta.accounts': info_obj.merchant_id
	}, function (err, outlets) {
		if(err) {
			cb(err, data);
		}
		else {
			if(outlets && outlets.length) {
				if(outlets.length === 1) {
					getCheckinCount({
						outlet: info_obj.outlet_id,
						phone: user.phone
					}, function (err, count) {
						if(err) {
							cb(err, data);
						}
						else {
							data.here = count;
							data.all = count;
							cb(null, data);
						}
					})
				}
				else {
					getCheckinCount({
						outlet: info_obj.outlet_id,
						phone: user.phone
					}, function (err, count) {
						if(err) {
							cb(err, data);
						}
						else {
							data.here = count;
							getCheckinCount({
								phone: user.phone,
								outlet: {
									$in: outlets.map(function (o) {return o._id;})
								}
							}, function (err, count) {
								if(err) {
									cb(err, data);
								}
								else {
									data.all = count;
									cb(null, data);
								}
							})
						}
					})
				}
			}
			else {
				cb(null, data);
			}
		}
	})
}

function getCheckinCount (q, cb) {
	Checkin.count(q, function (err, count) {
		cb(err, count);
	})
}

function getMerchantInfo(outlet_id, cb) {
	var data = {
		outlet_name: null,
		outlet_location: null,
		merchant_name: null,
		merchant_id: null,
		outlet_id: null,
		merchant_email: null
	};
	getOutlets({
		_id: outlet_id
	}, function (err, outlets) {
		if(err) {
			cb(err, null);
		}
		else {
			if(outlets && outlets.length) {
				var outlet = outlets[0];
				getMerchant(outlet.outlet_meta.accounts, function (err, merchant) {
					if(err) {
						console.log(err);
						cb(null, null);
					}
					else {
						if(merchant && merchant.email) {
							data.outlet_id = outlet_id;
							data.outlet_name = outlet.basics.name;
							data.outlet_location = outlet.contact.location.locality_1;
							data.merchant_name = merchant.contact_person ? merchant.contact_person.split(' ')[0] : null;
							data.merchant_id = merchant._id;
							data.merchant_email = merchant.email;
							cb(null, data);
						}
						else {
							console.log("Merchant email not there");
							cb(null, null);
						}
					}
				})
			}
			else {
				console.log("No outlet found here");
				cb(null, null);
			}
		}
	})
}

function getOutlets(q, cb) {
	Outlet.find(q).select({
		'basics.name': 1,
		'contact.location.locality_1': 1,
		'outlet_meta.accounts': 1
	}).exec(function (err, outlets) {
		cb(err, outlets)
	})
}

function getMerchant(accounts, cb) {
	Account.findOne({
		_id: {
			$in: accounts
		},
		role: 3
	}).exec(function (err, merchant) {
		cb(err, merchant);
	})
}

function getUserEmail(user) {
	if(user.social_graph
		&& user.social_graph.email 
		&& user.social_graph.email.email) {
		return user.social_graph.email.email;
	}
	if(user.social_graph
		&& user.social_graph.facebook 
		&& user.social_graph.facebook.email) {
		return user.social_graph.facebook.email;
	}
	return null;
}