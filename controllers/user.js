'use strict';
var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Checkin = mongoose.model('Checkin');
var Outlet = mongoose.model('Outlet');
var Voucher = mongoose.model('Voucher');
var _ = require('underscore');

var https = require('https');

module.exports.setGCM = function (req, res) {
    var user = req.user;
    var gcm = req.body;
    Account.findOne({_id: user._id}, function (err, account) {
        if (err) {
            res.send(400, {
                'status': 'error',
                'message': 'Error finding user',
                'info': JSON.stringify(err)
            });
        } else {
            if (account !== null) {
                account.gcm = gcm.id;
                account.save();
                res.send(200, {
                    'status': 'success',
                    'message': 'Account updated with GCM',
                    'info': JSON.stringify(account)
                });
            }
            else {
                res.send(400, {
                    'status': 'error',
                    'message': 'Account not found',
                    'info': ''
                });
            }
        }
    });
};


module.exports.setHome = function (req, res) {
    var user = req.user;
    var home = req.body;
    Account.findOne({_id: user._id}, function (err, account) {
        if (err) {
            res.send(400, {
                'status': 'error',
                'message': 'Error finding user',
                'info': JSON.stringify(err)
            });
        } else {
            if (account !== null) {
                account.home = home;
                account.save();
                res.send(200, {
                    'status': 'success',
                    'message': 'Account updated with home location',
                    'info': JSON.stringify(account)
                });
            }
            else {
                res.send(400, {
                    'status': 'error',
                    'message': 'Account not found',
                    'info': ''
                });
            }
        }
    });
};

module.exports.myCheckins = function (req, res) {
    Checkin.find({phone: req.user.phone}).populate('outlet').populate('checkin_for').populate('checkin_program').populate('checkin_tier').exec(function (err, checkins) {
        if(err) {
            res.send(400, {
                'status': 'error',
                'message': 'Error getting checkins',
                'info': JSON.stringify(err)
            });
        }
        else {
            res.send(200, {
                'status': 'success',
                'message': 'Got all checkins',
                'info': JSON.stringify(checkins)
            });
        }
    });
}

module.exports.myVouchers = function (req, res) {
    
    Voucher.find({'issue_details.issued_to': req.user._id})
        .populate('issue_details.issued_at')
        .populate('issue_details.program')
        .populate('issue_details.tier')
        .populate('issue_details.issued_for')
        .populate('used_details.used_by')
        .populate('used_details.used_at')
        .exec(function (err, vouchers) {
        if(err) {
            res.send(400, {
                'status': 'error',
                'message': 'Error getting vouchers',
                'info': JSON.stringify(err)
            });
        }
        else {
            res.send(200, {
                'status': 'success',
                'message': 'Got all vouchers',
                'info': JSON.stringify(vouchers)
            });
        }
    })
}

module.exports.socialUpdate = function (req, res) {

    if(req.body.access && req.body.info) {
        var access = req.body.access;
        var info = req.body.info;

        getFriends(access, info);
    }
    else {
        res.send(400, {
            'status': 'error',
            'message': 'Error in request',
            'info': ''
        });
    }

    function getFriends(access, info) {

        var body = '';
        https.get('https://graph.facebook.com/'+ info.id +'/friends?access_token=' + access.token, function (response) {

            response.on('data', function(chunk) {
                // append chunk to your data
                body += chunk;
            });

            response.on('end', function() {
                updateUser(access, info, body);
            });
        })
    }

    function updateUser(access, info, body) {

        var phone = req.user.phone;
        Account.findOne({phone: phone}, function (err, user) {

            if(err) {
                res.send(400, {
                    'status': 'error',
                    'message': 'Error saving user',
                    'info': JSON.stringify(err)
                });
            }
            else {
                user.facebook = {};
                user.facebook.access = access;
                user.facebook.info = info;
                user.facebook.friends = body;

                user.save(function (err) {
                    if(err) {
                        res.send(400, {
                            'status': 'error',
                            'message': 'Error saving user',
                            'info': JSON.stringify(err)
                        });
                    }
                    else {
                        res.send(200, {
                            'status': 'success',
                            'message': 'Save user successfully',
                            'info': JSON.stringify(user)
                        });
                    }
                })
            }
        })
    }
}