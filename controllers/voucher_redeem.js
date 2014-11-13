var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var Outlet = mongoose.model('Outlet');
var _ = require('underscore');
var CommonUtilities = require('../common/utilities');
var Reward = require('../models/reward_applicability');
var AutoCheckin = require('./checkins/auto_checkin');
var SMS = require('../common/smsSender');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var message;

var http = require('http');
http.post = require('http-post');

var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
var applicability = false;
module.exports.recieveSmsRedeem = function(req, res, code, phone) {
    checkForOutlet(code, phone);

    function checkForOutlet(code, phone) {

        var push_message = '';

        Outlet.findOne({
            'contact.phones.reg_mobile': {
                $elemMatch: {
                    num: phone
                }
            }
        }, function(err, outlet) {

            if (err || (outlet === null)) {
                push_message = 'Unable to Identify Outlet. Please use the Mobile Phone Registered with Twyst to send this SMS.';
                SMS.sendSms(phone, push_message);
            } else {
                redeemVoucherSms(code, phone, outlet._id);
            }
        });
    }

    function redeemVoucherSms(code, phone, outlet_id) {

        var push_message = '';

        Voucher.findOne({
                'basics.code': code
            })
            .populate('issue_details.issued_for')
            .populate('used_details.used_at')
            .populate('used_details.used_by')
            .populate('issue_details.program')
            .exec(function(err, voucher) {
                if (err || (voucher === null)) {
                    push_message = 'Sorry, the voucher ' + code + ' is invalid.';
                    SMS.sendSms(phone, push_message);
                } else {
                    isVoucherApplicableToThisOutlet(voucher,outlet_id);
                }
            });
    };

    function isVoucherApplicableToThisOutlet(voucher, outlet_id) {
        var applicable = false;
        applicability = false
        voucher.issue_details.issued_at.forEach(function(voucher_outlet_id) {
            if (voucher_outlet_id.equals(outlet_id)) {
                applicable = true;
                applicability = true;
            }
        });

        if (applicable) {
            validateVoucher(voucher, 'SMS', phone, outlet_id, req, res);
        } else {
            push_message = 'Sorry, the voucher ' + voucher.basics.code + ' is invalid.';
            SMS.sendSms(phone, push_message);
        }
    }
}

// TODO's in this function.
module.exports.redeemVoucherApp = function(req, res) {
    if (req.user) {
        if (req.user.phone) {
            isOutletInRequest();
        } else {
            res.send(200, {
                'status': 'error',
                'message': 'We could not find your phone',
                'info': ''
            });
        }
    } else {
        res.send(401, {
            'status': 'error',
            'message': 'You are not authenticated',
            'info': ''
        });
    }

    function isOutletInRequest() {

        if (req.body.outlet_id) {
            validateIfActualUser();
        } else {
            res.send(400, {
                'status': 'error',
                'message': 'You did not select any Outlet.',
                'info': 'Outlet not found in request body.'
            });
        }
    }

    function validateIfActualUser() {

        Voucher.findOne({
                'basics.code': req.body.code
            })
            .populate('issue_details.issued_for')
            .populate('issue_details.program')
            .populate('issue_details.issued_at')
            .exec(function(err, voucher) {
                if (err) {
                    res.send(400, {
                        'status': 'error',
                        'message': 'There was error serving your request.',
                        'info': ''
                    });
                } else {
                    if (voucher === null) {
                        res.send(200, {
                            'status': 'error',
                            'message': 'Sorry, the voucher ' + req.body.code + ' is invalid.',
                            'info': ''
                        });
                    } else {
                        console.log(req.user._id);
                        console.log
                        if (!voucher.issue_details.issued_to.equals(req.user._id)) {
                            res.send(200, {
                                'status': 'error',
                                'message': 'Sorry, the voucher ' + req.body.code + ' is invalid.',
                                'info': JSON.stringify(voucher)
                            });
                        } else {
                            validateVoucher(voucher, 'APP', null, null, req, res);
                        }
                    }
                }
            });
    }
};

module.exports.redeemVoucherPanel = function(req, res) {
    var code = req.body.code;
    var used_at = req.body.used_at;
    var used_time = req.body.used_time || Date.now();
    var applicable = null;

    if (code && used_at) {
        getVoucher();
    } else {
        res.send(400, {
            'status': 'error',
            'message': 'Please fill all required fields.',
            'info': ''
        });
    }

    function getVoucher() {

        Voucher.findOne({
                'basics.code': code
            })
            .populate('issue_details.issued_for')
            .populate('issue_details.program')
            .populate('issue_details.issued_to')
            .populate('issue_details.issued_at')
            .exec(function(err, voucher) {

                if (err) {
                    res.send(400, {
                        'status': 'error',
                        'message': 'There was error serving your request.',
                        'info': ''
                    });
                } else {
                    if (voucher === null) {
                        res.send(200, {
                            'status': 'error',
                            'message': 'Sorry, the voucher ' + code + ' is invalid.',
                            'info': ''
                        });
                    } else {
                        isVoucherApplicableToThisOutlet(voucher);
                    }
                }
            });
    }

    function isVoucherApplicableToThisOutlet(voucher) {
        voucher.issue_details.issued_at.forEach(function(voucher_outlet) {
            if (voucher_outlet._id.equals(used_at)) {
                applicable = voucher_outlet;
            }
        });

        if (applicable) {
            validateVoucher(voucher, 'PANEL', null, applicable, req, res);
        } else {
            res.send(200, {
                'status': 'success',
                'message': 'The voucher is expired.',
                'info': JSON.stringify(voucher)
            });
        }
    }
};

function getCheckinApplicabilityDay(array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] !== 'all days') {
            return 'on ' + array.join(',');
        }
        if (array[i] === 'all days') {
            return 'on all days of the week';
        }
    };
}

function getCheckinApplicabilityTime(array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] !== 'all day') {
            return 'at ' + array.join(',');
        }
        if (array[i] === 'all day') {
            return 'all day long';
        }
    };
}


function validateVoucher(voucher, type, phone, outlet_id, req, res) {

    if (!(voucher.issue_details.program.validity.burn_start <= Date.now() && voucher.issue_details.program.validity.burn_end >= Date.now())) {
        if (type === 'SMS') {
            push_message = 'Sorry, the voucher ' + voucher.basics.code + ' has expired on ' + voucher.issue_details.program.validity.burn_end + '.';
            SMS.sendSms(phone, push_message);
        } else {
            res.send(200, {
                'status': 'error',
                'message': 'Sorry, the voucher ' + voucher.basics.code + ' has expired on ' + voucher.issue_details.program.validity.burn_end + '.',
                'info': JSON.stringify(voucher)
            });
        }
    } else if (voucher.basics.status === 'merchant redeemed') {
        if (type === 'SMS') {
            push_message = 'Sorry, the voucher ' + voucher.basics.code + ' has already been redeemed at ' + voucher.used_details.used_at.basics.name + ', ' + voucher.used_details.used_at.contact.location.locality_1 + ' at ' + voucher.used_details.used_time + ', ' + voucher.used_details.used_time + '.';
            SMS.sendSms(phone, push_message);
        } else {
            res.send(200, {
                'status': 'error',
                'message': 'Sorry, The voucher ' + voucher.basics.code + ' is used.',
                'info': JSON.stringify(voucher)
            });
        }
    } else if (voucher.basics.status === 'user redeemed') {
        if (type === 'SMS') {
            push_message = 'User ' + voucher.used_details.used_by.phone + ' requested redemption of voucher ' + voucher.basics.code + ' at ' + voucher.used_details.used_time + ', ' + voucher.used_details.used_time + ' at ' + voucher.used_details.used_at.basics.name + ', ' + voucher.used_details.used_at.contact.location.locality_1 + '. Reward details-  ' + voucher.basics.description + ', valid ' + getCheckinApplicabilityDay(voucher.issue_details.issued_for.reward_applicability.day_of_week) + ', ' + getCheckinApplicabilityTime(voucher.issue_details.issued_for.reward_applicability.time_of_day) + '. ' + voucher.issue_details.issued_for.terms + '. .';
            SMS.sendSms(phone, push_message);
        } else {
            res.send(200, {
                'status': 'error',
                'message': 'Sorry, The voucher ' + voucher.basics.code + ' is used.',
                'info': JSON.stringify(voucher)
            });
        }
    } else {
        checkApplicabilityDay(voucher, type, phone, outlet_id, req, res);
    }
}

function checkApplicabilityDay(voucher, type, phone, outlet_id, req, res) {

    var mark_valid = false;
    if (voucher.issue_details.issued_for &&
        voucher.issue_details.issued_for.reward_applicability &&
        voucher.issue_details.issued_for.reward_applicability.day_of_week.length > 0) {

        var today = new Date().getDay();

        voucher.issue_details.issued_for.reward_applicability.day_of_week.forEach(function(day) {
            if (day === 'all days') {
                mark_valid = true;
            } else if (days[today] === day) {
                mark_valid = true;
            } else {
                // Do nothing
            }
        });

        if (mark_valid) {
            checkApplicabilityTime(voucher, type, phone, outlet_id, req, res);
        } else {
            if (type === 'SMS') {
                var push_message = 'Sorry, the voucher ' + voucher.basics.code + ' is valid only ' + getCheckinApplicabilityTime(voucher.issue_details.issued_for.reward_applicability.time_of_day) + '.'
                SMS.sendSms(phone, push_message);
            } else {
                res.send(200, {
                    'status': 'error',
                    'message': 'Sorry, the voucher ' + voucher.basics.code + ' is valid only ' + getCheckinApplicabilityTime(voucher.issue_details.issued_for.reward_applicability.time_of_day) + '.',
                    'info': JSON.stringify(voucher)
                });
            }
        }
    } else {
        if (type === 'SMS') {
            var push_message = 'Voucher ' + voucher.basics.code + ' is not valid at this time. Reward may be given only on ' + voucher.issue_details.issued_for.reward_applicability.day_of_week.join(' ') + ' .'
            SMS.sendSms(phone, push_message);
        } else {
            res.send(200, {
                'status': 'error',
                'message': 'Sorry, the voucher ' + voucher.basics.code + ' is not valid on ' + days[today] + '.',
                'info': JSON.stringify(voucher)
            });
        }
    }
}

function checkApplicabilityTime(voucher, type, phone, outlet_id, req, res) {
    var mark_valid = false;

    if (voucher.issue_details.issued_for.reward_applicability.time_of_day && voucher.issue_details.issued_for.reward_applicability.time_of_day.length > 0) {

        var hour = new Date().getHours();
        var minute = new Date().getMinutes();

        var time_in_minutes = hour * 60 + minute + 330;
        voucher.issue_details.issued_for.reward_applicability.time_of_day.forEach(function(time) {
            if (time === 'all day') {
                mark_valid = true;
            } else if (Reward.reward[time].start.time <= time_in_minutes && Reward.reward[time].end.time >= time_in_minutes) {
                mark_valid = true;
            } else {
                // Do nothing
            }
        });

        if (mark_valid) {
            redeemVoucher(voucher, type, phone, outlet_id, req, res);
        } else {
            if (type === 'SMS') {
                var push_message = 'Sorry, the voucher ' + voucher.basics.code + ' is valid only ' + getCheckinApplicabilityTime(voucher.issue_details.issued_for.reward_applicability.time_of_day) + '.'
                SMS.sendSms(phone, push_message);
            } else {
                res.send(200, {
                    'status': 'error',
                    'message': 'Sorry, the voucher ' + voucher.basics.code + ' is valid only ' + getCheckinApplicabilityTime(voucher.issue_details.issued_for.reward_applicability.time_of_day) + '.',
                    'info': JSON.stringify(voucher)
                });
            }
        }
    } else {
        if (type === 'SMS') {
            var push_message = 'Voucher ' + voucher.basics.code + ' is not valid at this time. Reward may be given only on ' + voucher.issue_details.issued_for.reward_applicability.time_of_day.join(' ') + ' .'
            SMS.sendSms(phone, push_message);
        } else {
            res.send(200, {
                'status': 'error',
                'message': 'Sorry, the voucher ' + voucher.basics.code + ' is valid only at ' + voucher.issue_details.issued_for.reward_applicability.time_of_day.join(' ') + '.',
                'info': JSON.stringify(voucher)
            });
        }
    }
}

function redeemVoucher (voucher, type, phone, outlet_id, req, res){
    if (type === 'SMS'){
        voucher.basics.status = 'merchant redeemed';
        voucher.redemption_phone_number = phone;
        voucher.used_details = {};
        voucher.used_details.used_at = outlet_id;
        voucher.used_details.used_by = voucher.issue_details.issued_to;
        voucher.used_details.used_time = Date.now();
        voucher.save(function(err, voucher) {
            if (err) {

            } else {
                var push_message = 'Voucher ' + voucher.basics.code + ' is VALID. Reward details-  ' + voucher.basics.description + '. ' + voucher.issue_details.issued_for.terms + '. .';
                SMS.sendSms(phone, push_message);
            }
        });
    }
    else if (type === 'APP'){
        voucher.basics.status = 'user redeemed';
        voucher.redemption_phone_number = req.user.phone;
        voucher.used_details = {};
        voucher.used_details.used_at = req.body.outlet_id;
        voucher.used_details.used_by = req.user._id;
        voucher.used_details.used_time = Date.now();
        voucher.used_details.used_date = Date.now();
        voucher.save(function(err, voucher) {
            if (err) {
                res.send(400, {
                    'status': 'error',
                    'message': 'Sorry, We could not process it. Please try again.',
                    'info': JSON.stringify(voucher)
                });
            } else {
                res.send(200, {
                    'status': 'success',
                    'message': 'Successfully redeemed voucher.',
                    'info': JSON.stringify(voucher)
                });
                var outlet_id = req.body.outlet_id;
                sendSmsNotifToMerchant(voucher, outlet_id, phone, req);
            }
        });
    }
    else {
        var check_voucher = voucher;
        voucher.basics.status = 'merchant redeemed';
        voucher.used_details = {};
        voucher.used_details.used_at = req.body.used_at;
        voucher.used_details.used_by = voucher.issue_details.issued_to;
        voucher.used_details.used_time = CommonUtilities.setCurrentTime(req.body.used_time || Date.now());
        voucher.used_details.used_date = Date.now();
        voucher.save(function(err, voucher) {
            if (err) {
                res.send(400, {
                    'status': 'error',
                    'message': 'We could not redeem your voucher.',
                    'info': JSON.stringify(voucher)
                });
            } else {
                var auto_checkin_obj = {
                    'phone': voucher.issue_details.issued_to.phone,
                    'outlet': outlet_id._id,
                    'location': 'DINE_IN',
                    'created_date': voucher.used_details.used_time
                };
                AutoCheckin.autoCheckin(auto_checkin_obj);
                if (voucher.issue_details &&
                    voucher.issue_details.issued_to &&
                    voucher.issue_details.issued_to.phone) {
                    var date = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
                    var message = 'Voucher code ' + check_voucher.basics.code + ' redeemed at ' + outlet_id.basics.name + ' on ' + CommonUtilities.formatDate(new Date(req.body.used_time)) + ' at ' + date.getHours() + ':' + date.getMinutes() + '. Keep checking-in at ' + outlet_id.basics.name + ' on Twyst for more rewards! Get Twyst http://twy.st/app';
                    SMS.sendSms(voucher.issue_details.issued_to.phone, message, 'VOUCHER_REDEEM_MESSAGE');
                }
                res.send(200, {
                    'status': 'success',
                    'message': 'Successfully redeemed voucher.',
                    'info': JSON.stringify(voucher)
                });
            }
        });
    }
}

function sendSmsNotifToMerchant(voucher, outlet_id, phone, req) {

    Outlet.findOne({
        _id: outlet_id
    }, function(err, outlet) {
        if (err || outlet === null) {
            console.log("Error getting outlet in SMS notification");
        } else {
            var current_time = new Date();
            outlet.contact.phones.reg_mobile.forEach(function(phone) {
                var push_message = 'User ' + req.user.phone + ' has redeemed voucher ' + voucher.basics.code + ' at ' + current_time + ', ' + current_time.getDate() + ' at ' + outlet.basics.name + ', ' + outlet.contact.location.locality_1.toString() + '. Voucher is VALID. Reward details-  ' + voucher.basics.description + '. ' + voucher.issue_details.issued_for.terms + '. .';
                SMS.sendSms(phone, push_message, 'VOUCHER_REDEEM_MERCHANT_MESSAGE');
            });
        }
    })
}