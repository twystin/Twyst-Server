'use strict';
var fs = require('fs'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Handlebars = require('handlebars');
var Account = mongoose.model('Account');

module.exports.login = function (req, res) {
    res.send(200, {
    	'status': 'success',
        'message': 'Login successful',
        'info': req.user
    });
};

module.exports.register = function(req, res) {
	var user = req.body,
		password = req.body.password
    Account.register(new Account(user), req.body.password, function(err, account) {
        if (err) {
            res.send(400, {
            	'status' : 'error',
                'message' : 'Error creating account',
                'info':  err 
            });
        } else {
            res.send(200, {
            	'status': 'success',
                'message' : 'Account created successfully',
                'info' : account
            });
        }
    });
};

module.exports.setEmailValidated = function (req, res) {
    Account.findOneAndUpdate(
        {'validated.email_validated.token': req.params.token},
        {$set: {'validated.email_validated.status': true} },
        {upsert: true},
        function (err, user) {
            if (err) {
                res.send(400, {'status': 'error',
                    'message': 'Error updating user ' + req.params.user_id,
                    'info': JSON.stringify(err)
                    });
            } else {
                res.send(200, {'status': 'success',
                    'message': 'Successfully updated user',
                    'info': JSON.stringify(user)});
            }
        }
    );
};

module.exports.logout = function(req, res) {
	if (req.isAuthenticated()) {
        // this destroys the current session (not really necessary because you get a new one
        req.session.destroy(function() {
            // if you don't want destroy the whole session, because you anyway get a new one you also could just change the flags and remove the private informations
            // req.session.user.save(callback(err, user)) // didn't checked this
            //delete req.session.user;  // remove credentials
            //req.session.authenticated = false; // set flag
            //res.clearCookie('connect.sid', { path: '/' }); // see comments above                res.send('removed session', 200); // tell the client everything went well
        });

        req.logout();
    };
	res.send({	'status': 'success',
				'message': 'Logout successful',
				'info': ''
			});
};

module.exports.query = function(req,res) {
	Account.find({}, function(err,users) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting list of users',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got all users',
						'info': JSON.stringify(users)
			});
		}
	}); 
}

module.exports.read = function(req,res) {
	Account.find({_id: req.params.user_id}, function(err,user) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting user id ' + req.params.user_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got user ' + req.params.user_id,
						'info': JSON.stringify(user)
			});
		}
	});
}

module.exports.validateByConsole = function(req,res) {
	Account.findOneAndUpdate(
							{username:req.params.user_id}, 
							{$set: {"role": req.body.role, "validated.role_validated": req.body.validated} }, 
							{upsert:true},
							function(err,user) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating user ' + req.params.user_id,
												'info': JSON.stringify(err)
									});
								} else {
									res.send(200, {	'status': 'success',
												'message': 'Successfully updated user',
												'info': JSON.stringify(user)
									});
								}
							});	
}

module.exports.update = function(req,res) {
	var update_user = {};
	update_user = _.extend(update_user, req.body);
	delete update_user._id; // Disallow editing of username
	Account.findOneAndUpdate(
							{_id:req.params.user_id}, 
							{$set: update_user }, 
							{upsert:true},
							function(err,user) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating user ' + req.params.user_id,
												'info': JSON.stringify(err)
									});
								} else {
									res.send(200, {	'status': 'success',
												'message': 'Successfully updated user',
												'info': JSON.stringify(user)
									});
								}
							});	
}

module.exports.delete = function(req,res) {
    Account.findOneAndRemove({username:req.params.user_id}, function(err){
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error deleting user ' + req.params.user_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Successfully deleted user',
						'info': ''
			});
		}
	});	
}

module.exports.findUserByPhone = function (req, res) {

	var phone = req.params.phone;

	if(phone) {
		findUser(phone);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Please specify phone number',
			'info': ''
		});
	}

	function findUser(phone) {

		Account.find({phone: phone}, function (err, user) {

			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting user',
					'info': JSON.stringify(err)
				});
			}
			else {
				if(user === null) {
					res.send(200, {
						'status': 'error',
						'message': 'User not found',
						'info': ''
					});
				}
				else {
					res.send(200, {
						'status': 'success',
						'message': 'Got user Successfully',
						'info': JSON.stringify(user)
					});
				}
			}
		});
	}
}

module.exports.verifyEmail = function (req, res) {
	var token = req.params.token,
		message = null;
	if(!token) {
		message = 'Sorry, The link is invalid.'
		sendTemplate(message);
	}
	else {
		Account.findOne({
			'validated.email_validated.token': token
		}).exec(function (err, user) {
			if(err) {
				message = 'Sorry, Error verifying email.'
				sendTemplate(message);
			}
			else {
				if(user) {
					user.validated.email_validated.status = true;
					user.save(function (err) {
						if(err) {
							message = 'Sorry, Error verifying email.'
							sendTemplate(message);
						}
						else {							
							message = 'Thanks, Your email address has been verified.';
							sendTemplate(message);
						}
					})
				}
				else {
					message = 'Sorry, The link is invalid.';
					sendTemplate(message);
				}
			}
		});
	}

	function sendTemplate(message) {
		fs.readFile("./templates/email_verify.handlebars", 
		'utf8', 
		function (err, data) {
			var template_data = {
				message: null
			}
			if(err) {
				template_data.message = 'Sorry, Error verifying email.'
			}
			else {
				template_data.message = message;
				var template = Handlebars.compile(data);
				template = template(template_data);
				res.send(template)
			}
		});
	}
}