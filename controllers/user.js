'use strict';
var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Checkin = mongoose.model('Checkin');
var Outlet = mongoose.model('Outlet');
var Voucher = mongoose.model('Voucher');
var _ = require('underscore');

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

// module.exports.myCheckins = function (req, res) {
//     var my_checkins = [];
//     var errs = [];
//     var checkin_object = {};
//     Checkin.find({phone: req.user.phone}).distinct('outlet').exec(function (err, checkins) {
//         if(err) {
//             res.send(400, {
//                 'status': 'error',
//                 'message': 'Error getting checkins',
//                 'info': JSON.stringify(err)
//             });
//         }
//         else {
//             var num_checkins = checkins.length;
//             if(num_checkins === 0) {
//                 res.send(200, {
//                     'status': 'success',
//                     'message': 'No checkins found',
//                     'info': JSON.stringify(checkins)
//                 });
//             }
//             else {
//                 checkins.forEach(function (checkin) {
//                     Checkin.count({phone: req.user.phone, outlet: checkin}, function (err, count) {
//                         if(err) {
//                             errs.push(err);
//                             num_checkins--;
//                         }
//                         else {
//                             Outlet.findOne({_id: checkin} , function (err, outlet) {
//                                 if(err) {
//                                     num_checkins--;
//                                 }
//                                 else {
//                                     if(outlet === null) {
//                                         num_checkins--;
//                                     }
//                                     else {
//                                         checkin_object.count = count;
//                                         checkin_object.outlet = outlet;
//                                         my_checkins.push(checkin_object);
//                                         num_checkins--;
//                                     }
//                                 }
//                                 if(num_checkins === 0) {
//                                     res.send(200, {
//                                         'status': 'success',
//                                         'message': 'Got all checkins',
//                                         'info': JSON.stringify(my_checkins)
//                                     });
//                                 }
//                             })
//                         }
//                     })
//                 })
//             }
//         }
//     })
// }

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