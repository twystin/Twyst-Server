var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Outlet = mongoose.model('Outlet');
var _ = require('underscore');

module.exports.read = function(req,res) {
    var code = req.params.code;

    if(code) {
        getVoucherDetails();
    }
    else {
        res.send(400, {'status': 'error',
                       'message': 'Error serving your request',
                       'info': JSON.stringify(err)
        });
    }

    function getVoucherDetails () {
        Voucher.findOne({'basics.code': code})
            .populate('issue_details.issued_for')
            .populate('issue_details.issued_to')
            .populate('issue_details.program')
            .exec(function(err,voucher) {
            if (err) {
                res.send(400, {'status': 'error',
                               'message': 'Error getting voucher details',
                               'info': JSON.stringify(err)
                });
            } else {
                if(voucher === null) {
                    res.send(200, { 'status': 'success',
                                    'message': 'Invalid voucher. Please check the voucher code.',
                                    'info': JSON.stringify(voucher)
                    });
                }
                else {
                    res.send(200, { 'status': 'success',
                                    'message': 'Got vouchers details',
                                    'info': JSON.stringify(voucher)
                    });
                }
            }
        }); 
    }
};

module.exports.readByUserPhone = function(req, res) {
    var phone = req.params.phone;

    if(phone) {
        getUserId();
    }
    else {
        res.send(400, {'status': 'error',
                       'message': 'Error phone number',
                       'info': JSON.stringify(err)
        });
    }

    function getUserId() {

        Account.find({phone: phone}, function (err, users) {

            if(err) {
                res.send(400, {'status': 'error',
                               'message': 'User not found',
                               'info': JSON.stringify(err)
                });
            }
            else {
                if(users.length === 0) {
                    res.send(200, {'status': 'error',
                                   'message': 'User has no vouchers.',
                                   'info': JSON.stringify(err)
                    });
                }
                else {
                    getOutlet(users);
                }
            }
        });
    }

    function getOutlet (users) {

        Outlet.find({'outlet_meta.accounts': req.user._id}, function (err, outlets) {

            if(err) {
                res.send(400, {'status': 'error',
                               'message': 'Error getting the outlets',
                               'info': JSON.stringify(err)
                });
            }
            else {
                if(outlets.length <= 0) {
                    res.send(200, {'status': 'error',
                                   'message': 'Outlets not found',
                                   'info': ''
                    });
                }
                else {
                    getVoucherDetails(users, outlets);
                }
            }
        })
    }

    function getVoucherDetails (users, outlets) {
        Voucher.find({
            'issue_details.issued_to': {
                $in: users.map(
                            function(item){
                                return mongoose.Types.ObjectId(String(item._id)); 
                        })
            },
            'issue_details.issued_at': {
                $in: outlets.map(
                            function(item){
                                return mongoose.Types.ObjectId(String(item._id)); 
                        })
            }
        }).populate('issue_details.issued_for')
            .populate('issue_details.issued_to')
            .populate('issue_details.program')
            .exec(function(err,vouchers) {
            
            if (err) {
                res.send(400, {'status': 'error',
                               'message': 'Error getting voucher details',
                               'info': JSON.stringify(err)
                });
            } else {
                if(vouchers.length > 0) {
                    res.send(200, { 'status': 'success',
                                    'message': 'Got vouchers details',
                                    'info': JSON.stringify(vouchers)
                    });
                }
                else {
                    res.send(200, { 'status': 'success',
                                    'message': 'No voucher found for this user',
                                    'info': ''
                    });
                }
            }
        }); 
    }
};

module.exports.changeStatus  = function (req, res){

    if(req.params.code) {
        getVoucher(req.params.code);
    }
    else {
        res.send(400, { 'status': 'error',
                       'message': 'request body empty',
                       'info': ''
        });
    }

    function getVoucher (code) {

        Voucher.findOne({'basics.code': code}, function (err, voucher) {

            if(err || voucher === null) {
                res.send(400, { 'status': 'error',
                               'message': 'Error serving your request',
                               'info': ''
                });
            }
            else {
                voucher.basics.status = 'merchant redeemed';
                voucher.save(function(err) {
                    if(err) {
                        res.send(400, { 'status': 'error',
                                       'message': 'Error serving your request',
                                       'info': ''
                        });
                    }
                    else {
                        res.send(200, { 'status': 'success',
                                       'message': 'Successfully redeemed Voucher.',
                                       'info': ''
                        });
                    }
                })
            }
        });
    }
}

module.exports.create = function(req,res) {
        var created_voucher = {};
        created_voucher = _.extend(created_voucher, req.body);
        
        var voucher = new Voucher(created_voucher);
        voucher.save(function(err) {
                if (err) {
                        res.send(400, {        'status': 'error',
                                                'message': 'Error saving voucher',
                                                'info': JSON.stringify(err)
                        });
                } else {
                        res.send(200, {        'status': 'success',
                                                'message': 'Saved voucher',
                                                'info': ''
                        });
                }                                
        })
};

module.exports.update = function(req,res) {
        var updated_voucher = {};
        updated_voucher = _.extend(updated_voucher, req.body);
        Voucher.findOneAndUpdate(
                {slug:req.params.voucher_id}, 
                {$set: updated_voucher }, 
                {upsert:true},
                function(err,voucher) {
                        if (err) {
                            res.send(400, {'status': 'error',
                                            'message': 'Error updating voucher ' + req.params.voucher_id,
                                            'info': JSON.stringify(err)
                            });
                        } else {
                            res.send(200, {'status': 'success',
                                            'message': 'Successfully updated voucher',
                                            'info': JSON.stringify(voucher)
                            });
                        }
                });
};

module.exports.delete = function(req,res) {
    Voucher.findOneAndRemove({slug:req.params.voucher_id}, function(err){
                if (err) {
                    res.send(400, {'status': 'error',
                                    'message': 'Error deleting voucher ' + req.params.voucher_id,
                                    'info': JSON.stringify(err)
                    });
                } else {
                    res.send(200, {'status': 'success',
                                    'message': 'Successfully deleted voucher',
                                    'info': ''
                    });
                }
        });
};