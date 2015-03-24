var mongoose = require('mongoose'),
    async = require('async'),
    _ = require("underscore");

var SpecialProgram = mongoose.model('SpecialProgram');

module.exports.create = function (req, res) {
    var created_special = {};
    created_special = _.extend(created_special, req.body);

    created_special.accounts = [];
    created_special.accounts.push(req.user._id);
    var special = new SpecialProgram(created_special);
    
    saveSpecialProgram(special, function (err) {
        if(err) {
            res.send(400, { 
                'status': 'error',
                'message': 'Error saving special.',
                'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Saved special successfully.',
                        'info': ''
            });
        }
    })
}

module.exports.update = function (req, res) {
    var updated_special = {};
    updated_special = _.extend(updated_special, req.body);
    delete updated_special.__v;
    updateSpecialProgram(updated_special, function (err) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error updating special.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Updated special successfully.',
                        'info': ''
            });
        }
    })
}

function updateSpecialProgram(special, cb) {
    var id = special._id;
    delete special._id;
    SpecialProgram.findOneAndUpdate({
        _id: id
    }, {
        $set: special
    }, {
        upsert: true
    }, function (err, special) {
        cb(err, special);
    })
}

function saveSpecialProgram(special, cb) {
    special.save(function (err) {
        cb(err);
    })
}

module.exports.read = function (req, res) {
    var user_id = req.user._id;
    readSpecialPrograms(user_id, function (err, specials) {
        if(err) {
            res.send(400, { 'status': 'error',
                        'message': 'Error getting specials.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Got specials successfully.',
                        'info': specials
            });
        }
    })

    function readSpecialPrograms(user_id, callback) {
        SpecialProgram.find({
            'accounts': user_id
        })
        .populate('outlets')
        .exec(function (err, specials) {
            callback(err, specials);
        })
    }
}

module.exports.readOne = function (req, res) {
    var special_id = req.params.special_id;
    var user_id = req.user._id
    if(!special_id) {
        res.send(400, { 
            'status': 'error',
            'message': 'Unexpected request format.',
            'info': ''
        });
    }
    else {
        readOneSpecialProgram(special_id, user_id, function (err, special) {
            if(err) {
                res.send(400, { 'status': 'error',
                            'message': 'Error getting special.',
                            'info': err
                });
            }
            else {
                res.send(200, { 'status': 'success',
                            'message': 'Got special successfully.',
                            'info': special
                });
            }
        })
    }

    function readOneSpecialProgram(special_id, user_id, callback) {
        SpecialProgram.findOne({
            'accounts': user_id,
            _id:  special_id
        })
        .exec(function (err, special) {
            callback(err, special);
        })
    }
}

module.exports.delete = function (req, res) {
    var special_id = req.params.special_id;
    var user_id = req.user._id;
    if(!special_id) {

    }
    else {
        archiveSpecialProgram(special_id, user_id, function (err, special) {
            if(err) {
                res.send(400, { 'status': 'error',
                            'message': 'Error deleting special.',
                            'info': err
                });
            }
            else {
                res.send(200, { 'status': 'success',
                            'message': 'Deleted special successfully.',
                            'info': ''
                });
            }
        });
    }

    function archiveSpecialProgram(special_id, user_id, callback) {
        SpecialProgram.findOne({
            _id: special,
            accounts: user_id
        }, function (err, special) {
            if(err) {
                callback(err, special);
            }
            else if(!special) {
                callback("SpecialProgram not found", special);
            }
            else {
                special.status = 'archived';
                delete special.__v;
                special.save(function (err) {
                    callback(err, null);
                })
            }
        })
    }
}