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
	var password = req.body.password,
        token = req.params.token;

    if(!password || !token) {
        res.send(400, { 
            'status': 'error',
            'message': 'Sorry password missing in request',
            'info': err
        });
    }
    else {
        getHashSalt(password, function (err, data) {
            if(err) {
                res.send(400, { 
                    'status': 'error',
                    'message': 'Sorry password could not be changed',
                    'info': err
                });
            }
            else {
                var q = {
                    reset_password_token: token
                };
                updateHashSalt(q, data, function (err) {
                    if(err) {
                        res.send(400, { 
                            'status': 'error',
                            'message': 'Sorry password could not be changed',
                            'info': err
                        });
                    }
                    else {
                        res.send(200, { 
                            'status': 'success',
                            'message': 'Password changed successfully',
                            'info': null
                        });
                    }
                });
            }
        });
    }
};

module.exports.changePassword = function (req, res) {
    var password = req.body.password;
    if(!password) {
        res.send(400, { 
            'status': 'error',
            'message': 'Sorry password missing in request',
            'info': err
        });
    }
    else {
        getHashSalt(password, function (err, data) {
            if(err) {
                res.send(400, { 
                    'status': 'error',
                    'message': 'Sorry password could not be changed',
                    'info': err
                });
            }
            else {
                var q = {
                    _id: req.user._id
                };
                updateHashSalt(q, data, function (err) {
                    if(err) {
                        res.send(400, { 
                            'status': 'error',
                            'message': 'Sorry password could not be changed',
                            'info': err
                        });
                    }
                    else {
                        res.send(200, { 
                            'status': 'success',
                            'message': 'Password changed successfully',
                            'info': null
                        });
                    }
                });
            }
        });
    }
};

function updateHashSalt(q, data, cb) {
    Account.findOneAndUpdate(q, {
        $set: data
    }, {
        upsert:true
    })
    .exec(function (err, user) {
        cb(err, user);
    })
}

function getHashSalt(password, cb) {
    crypto.randomBytes(options.saltlen, function(err, buf) {
        if(err) {
            cb(err);
        }
        else {
            var salt = buf.toString('hex');
            crypto.pbkdf2(password, 
                salt, 
                options.iterations, 
                options.keylen, 
            function(err, hashRaw) { 
                if(err) {
                    cb(err);
                }
                else {
                    var data = {
                        hash: new Buffer(hashRaw, 'binary').toString('hex'),
                        salt: salt
                    }
                    cb(null, data);
                }
            });
        }
    });
}