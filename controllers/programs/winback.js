var mongoose = require('mongoose');
var Winback = mongoose.model('Winback');
var Offer = mongoose.model('Offer');
var async = require('async');
var _ = require("underscore");

module.exports.create = function (req, res) {
    var created_winback = {};
    created_winback = _.extend(created_winback, req.body);
    delete created_winback.__v;
    created_winback.accounts = [];
    created_winback.accounts.push(req.user._id);
    var winback = new Winback(created_winback);
    
    saveWinback(winback, function (err) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error saving winback.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Saved winback successfully.',
                        'info': ''
            });
        }
    })
}

module.exports.update = function (req, res) {
    var updated_winback = {};
    updated_winback = _.extend(updated_winback, req.body);

    updateWinback(updated_winback, function (err) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error updating winback.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Updated winback successfully.',
                        'info': ''
            });
        }
    })
}

function updateWinback(winback, cb) {
    var id = winback._id;
    delete winback._id;
    Winback.findOneAndUpdate({
        _id: id
    }, {
        $set: winback
    }, {
        upsert: true
    }, function (err, winback) {
        cb(err, winback);
    })
}

function saveWinback(winback, cb) {
    winback.save(function (err) {
        cb(err);
    })
}

module.exports.read = function (req, res) {
    var user_id = req.user._id;
    readWinbacks(user_id, function (err, winbacks) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error getting winbacks.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Got winbacks successfully.',
                        'info': winbacks
            });
        }
    })

    function readWinbacks(user_id, callback) {
        Winback.find({
            'accounts': user_id
        })
        .populate('outlets')
        .exec(function (err, winbacks) {
            callback(err, winbacks);
        })
    }
}

module.exports.readOne = function (req, res) {
    var winback_id = req.params.winback_id;
    var user_id = req.user._id
    if(!winback_id) {
        res.send(400, { 
            'status': 'error',
            'message': 'Unexpected request format.',
            'info': ''
        });
    }
    else {
        readOneWinback(winback_id, user_id, function (err, winback) {
            if(err) {
                res.send(400, { 'status': 'error',
                            'message': 'Error getting winback.',
                            'info': err
                });
            }
            else {
                res.send(200, { 'status': 'success',
                            'message': 'Got winback successfully.',
                            'info': winback
                });
            }
        })
    }

    function readOneWinback(winback_id, user_id, callback) {
        Winback.findOne({
            'accounts': user_id,
            _id:  winback_id
        })
        .populate('outlets')
        .exec(function (err, winback) {
            callback(err, winback);
        })
    }
}

module.exports.delete = function (req, res) {
    var winback_id = req.params.winback_id;
    var user_id = req.user._id;
    if(!winback_id) {

    }
    else {
        archiveWinback(winback_id, user_id, function (err, winback) {
            if(err) {
                res.send(400, { 'status': 'error',
                            'message': 'Error deleting winback.',
                            'info': err
                });
            }
            else {
                res.send(200, { 'status': 'success',
                            'message': 'Deleted winback successfully.',
                            'info': ''
                });
            }
        });
    }

    function archiveWinback(winback_id, user_id, callback) {
        Winback.findOne({
            _id: winback,
            accounts: user_id
        }, function (err, winback) {
            if(err) {
                callback(err, winback);
            }
            else if(!winback) {
                callback("Winback not found", winback);
            }
            else {
                winback.status = 'archived';
                delete winback.__v;
                winback.save(function (err) {
                    callback(err, null);
                })
            }
        })
    }
}