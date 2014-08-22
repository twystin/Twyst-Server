var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Outlet = mongoose.model('Outlet');
var Checkin = mongoose.model('Checkin');
var AutoCheckin = require('./checkins/auto_checkin');

var async = require('async');

var _ = require('underscore');

module.exports.read = function(req, res) {
    var code = req.params.code;
    var searchedAt = req.params.searchedAt;

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
                    if(isVoucherApplicableToThisOutlet(voucher)) {
                        res.send(200, { 'status': 'success',
                                        'message': 'Got vouchers details',
                                        'info': JSON.stringify(voucher)
                        });
                    }
                    else {
                        res.send(400, { 'status': 'error',
                                        'message': 'Error - voucher does not belong to this outlet / merchant.',
                                        'info': ''
                        });
                    }
                }
            }
        }); 
    }

    function isVoucherApplicableToThisOutlet (voucher) {
        for(var i = 0; i < voucher.issue_details.issued_at.length; i++) {
            if(voucher.issue_details.issued_at[i].equals(searchedAt)) {
                return true;
            }
        }
        return false;
    }
};

module.exports.readByUserPhone = function(req, res) {
    var phone = req.params.phone;
    var outlet = req.params.outlet;

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
                                   'info': ''
                    });
                }
                else {
                    async.parallel({
                        CHECKIN_COUNT: function(callback) {
                            getCheckinCount(callback);
                        },
                        VOUCHERS: function(callback) {
                            getVoucherDetails(users, callback);
                        }
                    }, function(err, results) {
                        res.send(200, { 
                            'status': 'success',
                            'message': 'Got details for the user.',
                            'info': results
                        });
                    });
                }
            }
        });
    }

    function getCheckinCount(callback) {
        getActiveProgram();
        function getActiveProgram () {
            Program.findOne({
                    'status': 'active',
                    'outlets': outlet
                }, function (err, program) {
                    if(!program) {
                        callback(null, 0);
                    }
                    getCount(program);
            });
        }
        
        function getCount (program) {
            Checkin.count({
                'phone': phone,
                'checkin_program': program._id
            }, function (err, count) {

                    callback(null, count || 0);
            });
        } 
    }

    function getVoucherDetails (users, callback) {
        Voucher.find({
            'issue_details.issued_to': {
                $in: users.map(
                            function(item){
                                return mongoose.Types.ObjectId(String(item._id)); 
                        })
            },
            'issue_details.issued_at': outlet
        }).populate('issue_details.issued_for')
            .populate('issue_details.issued_to')
            .populate('issue_details.program')
            .sort({'basics.modified_at': -1})
            .exec(function(err,vouchers) {

                sortVouchers(vouchers)
        }); 

        function sortVouchers (vouchers) {

            if(vouchers.length <= 1) {
                callback(null, vouchers);
            }
            else {
                var i = 0, meta_data = [];
                vouchers.forEach(function (voucher) {
                    var data = {};
                    if((voucher.basics.status === 'active'
                        || voucher.basics.status === 'user redeemed')
                        && (new Date(voucher.issue_details.program.validity.burn_end) > new Date())) {
                        data.status = 2;
                        data.pos = i;
                        meta_data.push(data);
                    }
                    else if(voucher.basics.status === 'merchant redeemed') {
                        data.status = 1;
                        data.pos = i;
                        meta_data.push(data);
                    }
                    else if(voucher.basics.status !== 'merchant redeemed'
                        && new Date(voucher.issue_details.program.validity.burn_end) <= new Date()) {
                        data.status = 0;
                        data.pos = i;
                        meta_data.push(data);
                    }
                    i++;
                });

                meta_data = _.sortBy(meta_data, function (data) {
                    return -data.status;
                });

                var sorted_vouchers = [];
                var k = 0;
                meta_data.forEach(function (data) {
                    var pos = data.pos;
                    sorted_vouchers[k++] = vouchers[pos];
                });

                callback(null, sorted_vouchers);
            }
        }
    }
};

function getAccountIdForProgram(req) {
    if(req.user.role === 4 || req.user.role === 5) {
        var user = req.user.toObject();
        return user.account;
    } 
    return req.user._id;
}

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

        Voucher.findOne({'basics.code': code})
            .populate('issue_details.issued_to').exec(function (err, voucher) {

            if(err || voucher === null) {
                res.send(400, { 'status': 'error',
                               'message': 'Error serving your request',
                               'info': ''
                });
            }
            else {
                var auto_checkin_obj = {
                    'phone': voucher.issue_details.issued_to.phone,
                    'outlet': voucher.used_details.used_at,
                    'location': 'DINE_IN'
                };
                triggerAutoCheckin(auto_checkin_obj, voucher);
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

        function triggerAutoCheckin(auto_checkin_obj, voucher) {
            if(voucher.basics.status === 'active') {
                AutoCheckin.autoCheckin(auto_checkin_obj);    
            }
            else if(voucher.basics.status === 'user redeemed'){
                Checkin.findOne({
                    phone: auto_checkin_obj.phone,
                    checkin_program: voucher.issue_details.program,
                    checkin_date: {
                        $gt: new Date(new Date(voucher.used_details.used_time) - 3 * 60 * 60 * 1000),
                        $lt: new Date(new Date(voucher.used_details.used_time) + 3 * 60 * 60 * 1000)
                    }
                }, function (err, checkin) {
                    if(!checkin) {
                        AutoCheckin.autoCheckin(auto_checkin_obj); 
                    }
                })
            }
        }
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