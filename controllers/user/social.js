var mongoose = require("mongoose");
var Account = mongoose.model('Account');
var Mailer = require('../mailer/mailer'),
	keygen = require("keygenerator");

var WelcomeEmail = require('../../controllers/welcome_email_sms');
module.exports.update = function (req, res) {
	var user = req.user,
		key = req.body.key,
		data = req.body.data;
	if(user && key && data) {
		updateUser();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Request has no information.',
			'info': null
		});
	}

	function updateUser() {
		Account.findOne({
			_id: user._id
		}, function (err, user) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting user.',
					'info': null
				});
			}
			else {
				if(!user) {
					res.send(400, {
						'status': 'error',
						'message': 'User not registered.',
						'info': null
					});
				}
				else {
					user.social_graph = user.social_graph || {};
					user.social_graph[key] = data;
					var secret_code = null;
					if(key === 'email'
						&& user.social_graph
						&& user.social_graph.email
						&& user.social_graph['email'].email) {
						secret_code = keygen.session_id();
						user.validated = user.validated || {};
						user.validated.email_validated = user.validated.email_validated || {};
						user.validated.email_validated.token = secret_code;
					}
					else if(user.social_graph.facebook && user.social_graph.facebook.email) {
						var email_user = {};
						email_user = {
							email:  user.social_graph.facebook.email,
							type: 'WELCOME_MAILER'
						}
						WelcomeEmail.sendWelcomeMail(email_user);
					}
					delete user.__v;
					user.save(function (err) {
						if(err) {
							res.send(400, {
								'status': 'error',
								'message': 'Error updating user.',
								'info': null
							});
						}
						else {
							if(key === 'email') {
								initEmail(req.user, user.social_graph[key].email, secret_code);
							}
							res.send(200, {
								'status': 'success',
								'message': 'Successfully updated user.',
								'info': user
							});
						}
					})
				}
			}
		})
	}
}

function initEmail(user, email, secret_code) {
	if(!secret_code) {
		console.log("No email found in user welcome");
	}
	else {
		var email_object = {
			to: email,
			data: {
				link: null
			},
			type: 'WELCOME_APP',
			phone: user.phone
		};

		email_object.data.link = 'http://twyst.in/verify_email/' +false+'/'+ secret_code;
		Mailer.sendEmail(email_object);
	}
}
