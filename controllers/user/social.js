var mongoose = require("mongoose");
var Account = mongoose.model('Account');
var Mailer = require('../mailer/mailer'),
	keygen = require("keygenerator");

module.exports.update = function (req, res) {
	var user = req.user,
		key = req.body.key || 'email',
		data = req.body.data || {email: 'jayram.chandan@gmail.com'};
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
					console.log(user.social_graph[key])
					if(user.social_graph[key].email) {
						secret_code = keygen.session_id();
						user.validated = user.validated || {};
						user.validated.email_validated = user.validated.email_validated || {};
						user.validated.email_validated.token = secret_code;
					}
					user.save(function (err) {
						if(err) {
							res.send(400, {
								'status': 'error',
								'message': 'Error updating user.',
								'info': null
							});
						}
						else {
							initEmail(req.user, user.social_graph[key].email, secret_code);
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
			type: 'WELCOME_APP'
		};

		email_object.data.link = 'http://twyst.in/verify_email/' + secret_code;
		Mailer.sendEmail(email_object);
	}
}