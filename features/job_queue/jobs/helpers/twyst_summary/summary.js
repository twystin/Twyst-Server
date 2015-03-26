'use strict';
var mongoose = require('mongoose');
var fs = require('fs');
var async = require("async");

var Schema = mongoose.Schema;
var account = require('../../../../../models/account'),
    offer = require('../../../../../models/offer'),
    outlet = require('../../../../../models/outlet'),
    program = require('../../../../../models/program'),
    voucher = require('../../../../../models/voucher'),
    tier = require('../../../../../models/tier'),
    recommendation = require('../../../../../models/recommendation'),
    checkin = require('../../../../../models/checkin'),
    favourite = require('../../../../../models/favourite'),
    qr = require('../../../../../models/qr_code'),
    tag = require('../../../../../models/tag'),
    beta_users = require('../../../../../models/beta_users'),
    logs = require('../../../../../models/log'),
    logs = require('../../../../../models/smslog'),
    redirect = require('../../../../../models/redirect'),
    beta_merchants = require('../../../../../models/beta_merchants');

var Account = mongoose.model('Account');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var Favourites = mongoose.model('Favourite');
var data, csvout;
module.exports.getCount = function(callback) {
    initVars();
    async.series({
        total_checkins: function(cb) {
            totalCheckins(cb);
        },
        sms_checkins: function(cb) {
            smsCheckins(cb);
        },
        panel_checkins: function(cb) {
            panelCheckins(cb);
        },
        qr_checkins: function(cb) {
            qrCheckins(cb);
        },
        vouchers: function(cb) {
            vouchers(cb);
        },
        redemptions: function(cb) {
            redemptions(cb);
        },
        favs: function(cb) {
            favs(cb);
        },
        accounts: function(cb) {
            accounts(cb);
        }
    }, function(err, results) {
        console.log(csvout);
        fs.writeFileSync('./data/summary.csv', csvout, 'utf-8');
        callback(null, "Summary has been generated.")
    });
}

function initVars() {
    data = {};
    data.totalcheckin = {};
    data.smscheckin = {};
    data.panelcheckin = {};
    data.qrcheckin = {};

    data.voucher = {};
    data.redemptions = {};
    data.faves = {};
    data.users = {};

    csvout = "Data,Daily,Weekly,Monthly\n";
}

function totalCheckins (cb) {
    Checkin.count({created_date:{$gt:new Date(Date.now() - 24*60*60*1000)}}, function(e,s) {
        data.totalcheckin.daily = e || s;
        Checkin.count({created_date:{$gt:new Date(Date.now() - 7*24*60*60*1000)}}, function(e,s) {
            data.totalcheckin.weekly = e || s;
            Checkin.count({created_date:{$gt:new Date(Date.now() - 30*24*60*60*1000)}}, function(e,s) {
                data.totalcheckin.monthly = e || s;
                csvout += 'Total Checkin,' + data.totalcheckin.daily + ',' + data.totalcheckin.weekly + ',' + data.totalcheckin.monthly + '\n';
                cb(null, "Total checkins");
            });
        });
    });
}

function smsCheckins (cb) {
    Checkin.count({created_date:{$gt:new Date(Date.now() - 24*60*60*1000)}, checkin_type:'SMS'}, function(e,s) {
        data.smscheckin.daily = e || s;
        Checkin.count({created_date:{$gt:new Date(Date.now() - 7*24*60*60*1000)}, checkin_type:'SMS'}, function(e,s) {
            data.smscheckin.weekly = e || s;
            Checkin.count({created_date:{$gt:new Date(Date.now() - 30*24*60*60*1000)}, checkin_type:'SMS'}, function(e,s) {
                data.smscheckin.monthly = e || s;
                csvout += 'SMS Checkin,' + data.smscheckin.daily + ',' + data.smscheckin.weekly + ',' + data.smscheckin.monthly + '\n';
                cb(null, "Total sms checkins");
            });
        });
    });
}

function panelCheckins (cb) {
    Checkin.count({created_date:{$gt:new Date(Date.now() - 24*60*60*1000)}, checkin_type:'PANEL'}, function(e,s) {
        data.panelcheckin.daily = e || s;
        Checkin.count({created_date:{$gt:new Date(Date.now() - 7*24*60*60*1000)}, checkin_type:'PANEL'}, function(e,s) {
            data.panelcheckin.weekly = e || s;
            Checkin.count({created_date:{$gt:new Date(Date.now() - 30*24*60*60*1000)}, checkin_type:'PANEL'}, function(e,s) {
                data.panelcheckin.monthly = e || s;
                csvout += 'Panel Checkin,' + data.panelcheckin.daily + ',' + data.panelcheckin.weekly + ',' + data.panelcheckin.monthly + '\n';
                cb(null, "Total panel checkins");
            });
        });
    });
}

function qrCheckins (cb) {
    Checkin.count({created_date:{$gt:new Date(Date.now() - 24*60*60*1000)}, checkin_type:'QR'}, function(e,s) {
        data.qrcheckin.daily = e || s;
        Checkin.count({created_date:{$gt:new Date(Date.now() - 7*24*60*60*1000)}, checkin_type:'QR'}, function(e,s) {
            data.qrcheckin.weekly = e || s;
            Checkin.count({created_date:{$gt:new Date(Date.now() - 30*24*60*60*1000)}, checkin_type:'QR'}, function(e,s) {
                data.qrcheckin.monthly = e || s;
                csvout += 'QR Checkin,' + data.qrcheckin.daily + ',' + data.qrcheckin.weekly + ',' + data.qrcheckin.monthly + '\n';
                cb(null, "Total qr checkins");
            });
        });
    });
}

function vouchers (cb) {
    Voucher.count({'basics.created_at':{$gt:new Date(Date.now() - 24*60*60*1000)}}, function(e,s) {
        data.voucher.daily = e || s;
        Voucher.count({'basics.created_at':{$gt:new Date(Date.now() - 7*24*60*60*1000)}}, function(e,s) {
            data.voucher.weekly = e || s;
            Voucher.count({'basics.created_at':{$gt:new Date(Date.now() - 30*24*60*60*1000)}}, function(e,s) {
                data.voucher.monthly = e || s;
                csvout += 'Voucher,' + data.voucher.daily + ',' + data.voucher.weekly + ',' + data.voucher.monthly + '\n';
                cb(null, "Total vouchers");
            });
        });
    });
}

function redemptions (cb) {
    Voucher.count({'used_details.used_time':{$gt:new Date(Date.now() - 24*60*60*1000)}}, function(e,s) {
        data.redemptions.daily = e || s;
        Voucher.count({'used_details.used_time':{$gt:new Date(Date.now() - 7*24*60*60*1000)}}, function(e,s) {
            data.redemptions.weekly = e || s;
            Voucher.count({'used_details.used_time':{$gt:new Date(Date.now() - 30*24*60*60*1000)}}, function(e,s) {
                data.redemptions.monthly = e || s;
                csvout += 'Redemptions,' + data.redemptions.daily + ',' + data.redemptions.weekly + ',' + data.redemptions.monthly + '\n';
                cb(null, "Total redemptions");
            });
        });
    });
}

function favs (cb) {
    Favourites.count({'created_date':{$gt:new Date(Date.now() - 24*60*60*1000)}}, function(e,s) {
        data.faves.daily = e || s;
        Favourites.count({'created_date':{$gt:new Date(Date.now() - 7*24*60*60*1000)}}, function(e,s) {
            data.faves.weekly = e || s;
            Favourites.count({'created_date':{$gt:new Date(Date.now() - 30*24*60*60*1000)}}, function(e,s) {
                data.faves.monthly = e || s;
                csvout += 'Favourites,' + data.faves.daily + ',' + data.faves.weekly + ',' + data.faves.monthly + '\n';
                cb(null, "Total favs");
            });
        });
    });
}

function accounts (cb) {
    var dayID = objectIdWithTimestamp((Date.now() - 24*60*60*1000));
    var weekID = objectIdWithTimestamp((Date.now() - 7*24*60*60*1000));
    var monthID = objectIdWithTimestamp((Date.now() - 30*24*60*60*1000));
    Account.count({_id:{$gt: dayID}, role:6}, function(e,s) {
        data.users.daily = e || s;
        Account.count({_id:{$gt: weekID}, role:6}, function(e,s) {
            data.users.weekly = e || s;
            Account.count({_id:{$gt: monthID}, role:6}, function(e,s) {
                data.users.monthly = e || s;
                csvout += 'Users,' + data.users.daily + ',' + data.users.weekly + ',' + data.users.monthly + '\n';
                cb(null, "Total accounts");
            });
        });
    });
}

function objectIdWithTimestamp(timestamp) {
    // Convert string date to Date object (otherwise assume timestamp is a date)
    if (typeof(timestamp) == 'string') {
        timestamp = new Date(timestamp);
    }

    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);

    // Create an ObjectId with that hex timestamp
    var constructedObjectId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId
}
