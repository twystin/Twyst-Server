'use strict';
var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Checkin = mongoose.model('Checkin');
var Outlet = mongoose.model('Outlet');
var Voucher = mongoose.model('Voucher');
var Social = mongoose.model('Social');
var UserLoc = mongoose.model('UserLoc');
var _ = require('underscore');

var https = require('https');

module.exports.setGCM = function (req, res) {
    var gcm = req.body.gcm;
    if(!gcm) {
        res.send(400, {
            'status': 'error',
            'message': 'Request requires GCM in body',
            'info': null
        });
    }
    else {
        Account.findOneAndUpdate({
            _id: req.user._id
        }, {
            $set: {
                gcm: gcm.id
            }
        }, {
            upsert:true
        })
        .exec(function (err) {
            if(err) {
                res.send(400, {
                    'status': 'error',
                    'message': 'Error updating gcm',
                    'info': err
                });
            }
            else {
                res.send(200, {
                    'status': 'success',
                    'message': 'Account updated with gcm',
                    'info': null
                });
            }
        })
    }
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

module.exports.setLocation = function (id, phone, current_loc) {
    var loc_obj = current_loc;
    Account.findOne({_id: id}, function (err, user) {
        if(err || !user) {
            // DO NOTHING
        }
        else {
            user.home = current_loc;
            if(!user.role || user.role === 6) {
                user.role = 7;
            }
            user.save();
        }
    });

    UserLoc.findOne({account: id}, function (err, user_loc) {
        if(err) {
            // DO nothing
        }
        else {
            loc_obj.logged_time = Date.now();
            if(!user_loc) {
                var loc = {};
                loc.account = id;
                loc.phone = phone;
                user_loc = new UserLoc(loc);
            }
            user_loc.locations = user_loc.locations || [];
            user_loc.locations.push(loc_obj);
            user_loc.save();
        }
    })
}

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
                body = JSON.parse(body);
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
                user.facebook = user.facebook || {};
                user.facebook.name = info.name;
                user.facebook.id = info.id;

                var obj = {};
                obj.facebook = {};
                obj.facebook.access = access;
                obj.facebook.info = info;
                obj.facebook.friends = body;

                user.save(function (err) {
                    if(err) {
                        res.send(400, {
                            'status': 'error',
                            'message': 'Error saving user',
                            'info': JSON.stringify(err)
                        });
                    }
                    else {
                        saveSocial(obj);
                    }
                })
            }
        })
    }

    function saveSocial(obj) {

        Social.findOne({'facebook.info.id': obj.facebook.info.id}, function (err, social) {

            if(err) {
                res.send(400, {
                    'status': 'error',
                    'message': 'Error saving social data.',
                    'info': JSON.stringify(err)
                });
            }
            else {
                if(social === null) {
                    obj = new Social(obj);
                    createNew(obj);
                }
                else {
                    updateExisting(obj);
                }
            }
        });

        function createNew (obj) {
            obj.save(function (err) {
                if(err) {
                    res.send(400, {
                            'status': 'error',
                            'message': 'Error saving social data.',
                            'info': JSON.stringify(err)
                        });
                }
                else {
                    res.send(200, {
                        'status': 'success',
                        'message': 'Saved user successfully',
                        'info': ''
                    });
                }
            });
        }

        function updateExisting (obj) {

            Social.findOneAndUpdate(
                {'facebook.info.id': obj.facebook.info.id},
                {$set: obj},{upsert: true}, function (err) {

                if(err) {
                    res.send(400, {
                        'status': 'error',
                        'message': 'Error saving social data.',
                        'info': JSON.stringify(err)
                    });
                }
                else {
                    res.send(200, {
                        'status': 'success',
                        'message': 'Saved user successfully',
                        'info': ''
                    });
                }
            });
        }
    }
}

module.exports.friendsOnTwyst = function (req, res) {
    var user = req.user;
    if(user.facebook && user.facebook.id) {
        var facebook_id = req.user.facebook.id;
        getSocial(facebook_id);
    }
    else {
        res.send(400, {
            'status': 'error',
            'message': 'Your facebook is not connected.',
            'info': ''
        });
    }

    function getSocial(facebook_id) {
        Social.findOne({'facebook.info.id': facebook_id}, function (err, data) {
            if(err) {
                res.send(400, {
                    'status': 'error',
                    'message': 'Error getting social data.',
                    'info': JSON.stringify(err)
                });
            }
            else {
                if(data === null) {
                    res.send(200, {
                        'status': 'error',
                        'message': 'Error getting social data.',
                        'info': ''
                    });
                }
                else {
                    if(data.facebook 
                        && data.facebook.friends
                        && data.facebook.friends.data.length > 0) {

                        findFriendsOnTwyst(data);
                    }
                    else {
                        res.send(200, {
                            'status': 'error',
                            'message': 'Your friends not found.',
                            'info': ''
                        });
                    }
                }
            }
        });
    }

    function findFriendsOnTwyst(data) {
        Social.find(
            {'facebook.info.id': {$in:
                data.facebook.friends.data.map(
                        function(obj){ 
                            return obj.id; 
                    })
            }}, function (err, found_friends_data) {
                if(err) {
                    res.send(400, {
                        'status': 'error',
                        'message': 'Error getting friends.',
                        'info': JSON.stringify(err)
                    });
                }
                else {
                    processData(found_friends_data);
                }
            })
    }

    function processData(found_friends_data) {

        var processed_data = [];

        if(found_friends_data.length > 0) {
            found_friends_data.forEach(function (obj) {
                var temp_friend = {};
                temp_friend.name = obj.facebook.info.name;
                temp_friend.id = obj.facebook.info.id;

                processed_data.push(temp_friend);
            });
        }
        res.send(200, {
            'status': 'success',
            'message': 'Successfully got friends data',
            'info': JSON.stringify(processed_data)
        });
    }
};