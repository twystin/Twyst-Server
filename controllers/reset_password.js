var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var _ = require('underscore');

var util = require('util'),
    crypto = require('crypto'),
    LocalStrategy = require('passport-local').Strategy,
    BadRequestError = require('passport-local').BadRequestError;

options = {};
options.saltlen = options.saltlen || 32;
options.iterations = options.iterations || 25000;
options.keylen = options.keylen || 512;
    
options.hashField = options.hashField || 'hash';
options.saltField = options.saltField || 'salt';
options.missingPasswordError = options.missingPasswordError || 'Password argument not set!';
    

module.exports.resetPassword = function (req, res) {
	var password = req.body.password;
	var token = req.params.token;

        if (!password) {
            res.send(options.missingPasswordError);
        }
        
        var updated_user = {};
        updated_user.hash = '';
        updated_user.salt = '';

        crypto.randomBytes(options.saltlen, function(err, buf) {
            if (err) {
                res.send(err);
            }

            var salt = buf.toString('hex');

            crypto.pbkdf2(password, salt, options.iterations, options.keylen, function(err, hashRaw) {
                if (err) {
                    res.send(err);
                }
                else {
                	updated_user.hash = new Buffer(hashRaw, 'binary').toString('hex');
                	updated_user.salt = salt;
                	Account.findOneAndUpdate(
							{reset_password_token: token}, 
							{$set: updated_user}, 
							{upsert:true},
							function(err,user) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating password ' + req.params.user_id,
												'info': JSON.stringify(err)
									});
								} else {
									res.send(200, {	'status': 'success',
												'message': 'Successfully updated password',
												'info': JSON.stringify(user)
									});
								}
					});
                }
            });
        });
};

module.exports.changePassword = function (req, res) {
    var password = req.body.password;
    var user_id = req.params.user_id;

        if (!password) {
            res.send(options.missingPasswordError);
        }
        
        var updated_user = {};
        updated_user.hash = '';
        updated_user.salt = '';

        crypto.randomBytes(options.saltlen, function(err, buf) {
            if (err) {
                res.send(err);
            }

            var salt = buf.toString('hex');

            crypto.pbkdf2(password, salt, options.iterations, options.keylen, function(err, hashRaw) {
                if (err) {
                    res.send(err);
                }
                else {
                    updated_user.hash = new Buffer(hashRaw, 'binary').toString('hex');
                    updated_user.salt = salt;
                    Account.findOneAndUpdate(
                            {_id: user_id}, 
                            {$set: updated_user}, 
                            {upsert:true},
                            function(err,user) {
                                if (err) {
                                    res.send(400, { 'status': 'error',
                                                'message': 'Error updating password ' + req.params.user_id,
                                                'info': JSON.stringify(err)
                                    });
                                } else {
                                    res.send(200, { 'status': 'success',
                                                'message': 'Successfully updated password',
                                                'info': JSON.stringify(user)
                                    });
                                }
                    });
                }
            });
        });
};