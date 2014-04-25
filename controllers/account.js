'use strict';
var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var _ = require('underscore');

module.exports.login = function (req, res) {
    res.send(200, {
    	'status': 'success',
        'message': 'Login successful',
        'info': req.user
    });
};

module.exports.register = function(req, res, next) {
    Account.register(new Account({ username : req.body.username, email: req.body.email, role: req.body.role, parent: req.body.parent}), req.body.password, function(err, account) {
        if (err) {
            res.send(400, {'status' : 'error',
                'message' : 'Error creating account',
                'info':  err });
        } else {
            res.send(200, {'status': 'success',
                'message' : 'Account created',
                'info' : account});
            next();
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
	req.logout();
	console.log(req)
	req.session.destroy();
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