var mongoose = require('mongoose')
    _ = require('underscore'),
    async = require('async'),
    Utils = require('../common/utilities');
var Program = mongoose.model('Program'),
    Tier = mongoose.model('Tier'),
    Reward = mongoose.model('Reward');

module.exports.readOne = function (req, res) {
    var program_id = req.params.program_id;
    if(!program_id) {
        res.send(400, {
            'status': 'error',
            'message': 'Error reading reward.',
            'info': null
        });
    }

    Reward.findOne({
        program: program_id
    }, function (err, reward) {
        if(err) {
            res.send(400, {
                'status': 'error',
                'message': 'Error reading reward.',
                'info': null
            });
        }
        else {
            res.send(200, {
                'status': 'success',
                'message': 'Got reward successfully',
                'info': reward
            });
        }
    })
}

module.exports.createTable = function (req, res) {
    var program_id = req.body.program_id;
    createRewardTable(program_id, function (err, done) {
        if(err) {
            res.send(400, {
                'status': 'error',
                'message': err,
                'info': err
            });
        }
        else {
            res.send(200, {
                'status': 'success',
                'message': 'Reward table populated',
                'info': null
            })
        }
    });
}

module.exports.createRewardTable = createRewardTable = function(program_id, cb) {

    if(!program_id) {
        cb('Error processing: No program ID', null);
    }
    else {
        getProgram(program_id, function (err, program) {
            if(err) {
                cb(err, null);
            }
            else {
                if(!program) {
                    cb('Error processing: Program not found', null);
                }
                else {
                    populateProgram(program, function (err, program) {
                        if(err) {
                            cb(err, null);
                        }
                        else {
                            var rewards = getRewards(program);
                            saveReward(program, rewards, function (err, success) {
                                if(err) {
                                    cb(err, null);
                                }
                                else {
                                    cb(null, success);
                                }
                            })
                        }
                    })
                }
            }
        })
    }
}

function saveReward(program, rewards, cb) {
    var program_id = program._id;
    Reward.findOne({
        program: program_id
    }, function (err, reward) {
        if(err) {
            cb(err, reward);
        }
        else {
            reward = reward || new Reward(reward);
            reward.program = program_id;
            reward.rewards = rewards;
            reward.outlets = program.outlets;
            reward.status = program.status;
            reward.modified_date = Date.now();
            reward.save(function (err, reward) {
                cb(err, reward);
            })
        }
    })
}

function getRewards(program) {
    var rewards = [];
    if(!program.tiers || !program.tiers.length) {
        return rewards;
    }
    for (var i = 0; i < program.tiers.length; i++) {
        if (program.tiers[i]) {
            for (var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
                for (var j = 0; j < program.tiers[i].offers.length; j++) {
                    if (program.tiers[i].offers[j]) {
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                            if ((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                                rewards.push(getRewardObject(lim, program.tiers[i], program.tiers[i].offers[j]));
                            }
                        }
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
                            if (lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                rewards.push(getRewardObject(lim, program.tiers[i], program.tiers[i].offers[j]));
                            }
                        }
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                            if (lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                rewards.push(getRewardObject(lim, program.tiers[i], program.tiers[i].offers[j]));
                            }
                        }
                    }
                }
            }
        }
    }
    return getSortedUniqueRewards(rewards);
}

function getRewardObject(on_count, tier, offer) {
    return {
        count: on_count + 1,
        tier: tier._id,
        offer: offer._id,
        qr_only: offer.qr_only || false,
        reward: offer.basics.title,
        rewardified: Utils.rewardify(offer)
    };
}

function getSortedUniqueRewards(rewards){
    rewards = _.uniq(rewards, function(obj) {
        return obj.count;
    });

    rewards = _.sortBy(rewards, function(obj) {
        return obj.count;
    });

    return rewards;
}

function getProgram (program_id, cb) {
    Program.findOne({
        _id: program_id
    }, function (err, program) {
        cb(err, program);
    })
}

function populateProgram(program, cb) {
    Tier.find({
        _id: {
            $in: program.tiers
        }
    })
    .populate('offers')
    .exec(function(err, tiers) {
        if (err) {
            cb(err, program);
        } else {
            program = program.toObject();
            program.tiers = tiers;
            cb(null, program);
        }
    })
}