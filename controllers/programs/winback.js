var mongoose = require('mongoose');
var Winback = mongoose.model('Winback');
var Offer = mongoose.model('Offer');
var async = require('async');
var _ = require("underscore");

module.exports.create = function (req, res) {
    var created_winback = {};
    created_winback = _.extend(created_winback, req.body);

    if(created_winback.offers.length > 0) {
        saveOffers(created_winback.offers, function (err, offers) {
            if(err) {
                res.send(400, { 
                    'status': 'error',
                    'message': 'Unable to create offers in winback.',
                    'info': err
                });
            }
            else {
                created_winback.offers = offers;
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
        })
    }
    else {
        res.send(400, { 
            'status': 'error',
            'message': 'Winback must have atleast one offer.',
            'info': null
        });
    }
}

module.exports.update = function (req, res) {
    var updated_winback = {};
    updated_winback = _.extend(updated_winback, req.body);

    if(updated_winback.offers.length > 0) {
        saveOffers(updated_winback.offers, function (err, offers) {
            if(err) {
                res.send(400, { 
                    'status': 'error',
                    'message': 'Unable to update offers in winback.',
                    'info': err
                });
            }
            else {
                updated_winback.offers = offers;
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
        })
    }
    else {
        res.send(400, { 
            'status': 'error',
            'message': 'Winback must have atleast one offer.',
            'info': null
        });
    }
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

function saveOffers (offers, cb) {
    var ids = [];
    async.each(offers, function (o, callback) {
        var created_offer = {};
        created_offer = _.extend(created_offer, o);
        if(!o._id) {
            var offer = new Offer(created_offer);
            saveOffer(offer, function (err, offer) {
                if(err) {
                    callback(err, null);
                }
                else {
                    ids.push(offer._id);
                    callback();
                }
            });
        }
        else {
            updateOffer(o, function (err, offer) {
                if(err) {
                    callback(err, null);
                }
                else {
                    ids.push(offer._id);
                    callback();
                }
            });
        }
    }, function (err) {
        cb(err, ids);
    })
}

function updateOffer(offer, cb) {
    var id = offer._id;
    delete offer._id;
    Offer.findOneAndUpdate({
        _id: id
    }, {
        $set: offer
    }, {
        upsert: true
    }, function (err, offer) {
        cb(err, offer);
    })
}

function saveOffer(offer, cb) {
    offer.save(function (err, offer) {
        cb(err, offer);
    });
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
            'accounts': user_id,
            'status': {
                $ne: 'archived'
            }
        })
        .populate('outlets')
        .populate('offers')
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
        .populate('offers')
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
                winback.save(function (err) {
                    callback(err, null);
                })
            }
        })
    }
}