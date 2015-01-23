var mongoose = require('mongoose');
var Account = mongoose.model('Account'),
    Checkin = mongoose.model('Checkin'),
    Reward = mongoose.model('Reward'),
    Outlet = mongoose.model('Outlet');

module.exports.isUserRegistered = function(phone, cb) {
    Account.findOne({
        phone: phone
    })
    .exec(function (err, user) {
        cb(err, user);
    })
}

module.exports.registerUser = function (phone, cb) {
    var account = {
        username: phone,
        phone: phone,
        role: 6,
        otp_validated: true
    };

    Account.register(
        new Account(account), 
        phone,
        function(err, user) {
            cb(err, user);
    });
}

module.exports.otherCheckinToday = function (phone, created_date, cb) {
    var lower_range = new Date(new Date(created_date).getTime() - 10800000),
        upper_range = new Date(new Date(created_date).getTime() + 10800000);
    Checkin.findOne({
        phone: phone,
        created_date: {
            $gt: lower_range,
            $lt: upper_range
        }
    })
    .sort({'created_date': -1})
    .exec(function (err, checkin) {
        cb(err, checkin);
    })
}

module.exports.getCheckinInfo = function (checkin, outlet_id) {
    if(checkin.outlet.equals(outlet_id)) {
        return 'HERE';
    }
    else {
        var time = new Date() - new Date(checkin.created_date);
        if(time > 300000) {
            return 'ALLOW';
        }
        else {
            return 'SOMEWHERE_ELSE';
        }
    }
}

module.exports.hasActiveRewards = function (outlet_id, cb) {
    Reward.findOne({
        outlets: outlet_id,
        status: 'active'
    })
    .populate('program').exec(function (err, reward) {
        cb(err, reward);
    })
}

module.exports.countCheckinHere = function (phone, program, cb) {
    Checkin.count({
        phone: phone,
        checkin_program: program
    }, function (err, count) {
        cb(err, count);
    })
}

module.exports.getMatchedReward = function (reward, count) {
    count = count || 0;
    count += 1;
    for (var i = 0; i < reward.rewards.length; i++) {
        if(reward.rewards[i].count > count) {
            return reward.rewards[i];
        }
    };
    return null;
}

module.exports.getCheckinObject = function (_obj) {
    var checkin = {
        phone: _obj.phone,
        outlet: _obj.outlet,
        checkin_program: _obj.reward.program._id,
        checkin_tier: _obj.current_reward.tier,
        checkin_for: _obj.current_reward.offer,
        location: _obj.location,
        checkin_type: _obj.checkin_type,
        checkin_code: _obj.checkin_code,
        created_date: _obj.created_date
    };
    return checkin;
}

module.exports.getOutlet = function (outlet_id, cb) {
    Outlet.findOne({
        _id: outlet_id
    })
    .exec(function (err, outlet) {
        cb(err, outlet);
    })
}