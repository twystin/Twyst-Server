var mongoose = require('mongoose');
var BirthAnniv = mongoose.model('BirthAnniv');
var Offer = mongoose.model('Offer');
var async = require('async');
var _ = require("underscore");

module.exports.create = function (req, res) {
    var created_birthanniv = {};
    created_birthanniv = _.extend(created_birthanniv, req.body);

    created_birthanniv.accounts = [];
    created_birthanniv.accounts.push(req.user._id);
    var birthanniv = new BirthAnniv(created_birthanniv);
    
    saveBirthAnniv(birthanniv, function (err) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error saving birthanniv.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Saved birthanniv successfully.',
                        'info': ''
            });
        }
    })
}

module.exports.update = function (req, res) {
    var updated_birthanniv = {};
    updated_birthanniv = _.extend(updated_birthanniv, req.body);

    updateBirthAnniv(updated_birthanniv, function (err) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error updating birthanniv.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Updated birthanniv successfully.',
                        'info': ''
            });
        }
    })
}

function updateBirthAnniv(birthanniv, cb) {
    var id = birthanniv._id;
    delete birthanniv._id;
    BirthAnniv.findOneAndUpdate({
        _id: id
    }, {
        $set: birthanniv
    }, {
        upsert: true
    }, function (err, birthanniv) {
        cb(err, birthanniv);
    })
}

function saveBirthAnniv(birthanniv, cb) {
    birthanniv.save(function (err) {
        cb(err);
    })
}

module.exports.read = function (req, res) {
    var user_id = req.user._id;
    readBirthAnnivs(user_id, function (err, birthannivs) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error getting birthannivs.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Got birthannivs successfully.',
                        'info': birthannivs
            });
        }
    })

    function readBirthAnnivs(user_id, callback) {
        BirthAnniv.find({
            'accounts': user_id
        })
        .populate('outlets')
        .exec(function (err, birthannivs) {
            callback(err, birthannivs);
        })
    }
}

module.exports.readOne = function (req, res) {
    var birthanniv_id = req.params.birthanniv_id;
    var user_id = req.user._id
    if(!birthanniv_id) {
        res.send(400, { 
            'status': 'error',
            'message': 'Unexpected request format.',
            'info': ''
        });
    }
    else {
        readOneBirthAnniv(birthanniv_id, user_id, function (err, birthanniv) {
            if(err) {
                res.send(400, { 'status': 'error',
                            'message': 'Error getting birthanniv.',
                            'info': err
                });
            }
            else {
                res.send(200, { 'status': 'success',
                            'message': 'Got birthanniv successfully.',
                            'info': birthanniv
                });
            }
        })
    }

    function readOneBirthAnniv(birthanniv_id, user_id, callback) {
        BirthAnniv.findOne({
            'accounts': user_id,
            _id:  birthanniv_id
        })
        .populate('outlets')
        .exec(function (err, birthanniv) {
            callback(err, birthanniv);
        })
    }
}

module.exports.delete = function (req, res) {
    var birthanniv_id = req.params.birthanniv_id;
    var user_id = req.user._id;
    if(!birthanniv_id) {

    }
    else {
        archiveBirthAnniv(birthanniv_id, user_id, function (err, birthanniv) {
            if(err) {
                res.send(400, { 'status': 'error',
                            'message': 'Error deleting birthanniv.',
                            'info': err
                });
            }
            else {
                res.send(200, { 'status': 'success',
                            'message': 'Deleted birthanniv successfully.',
                            'info': ''
                });
            }
        });
    }

    function archiveBirthAnniv(birthanniv_id, user_id, callback) {
        BirthAnniv.findOne({
            _id: birthanniv,
            accounts: user_id
        }, function (err, birthanniv) {
            if(err) {
                callback(err, birthanniv);
            }
            else if(!birthanniv) {
                callback("BirthAnniv not found", birthanniv);
            }
            else {
                birthanniv.status = 'archived';
                birthanniv.save(function (err) {
                    callback(err, null);
                })
            }
        })
    }
}