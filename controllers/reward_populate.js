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

module.exports.createRewardTable =  function(program_id, cb) {

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
            if(!reward) {
                var reward = {
                    program: program_id,
                    outlets: program.outlets,
                    status: program.status,
                    rewards: rewards
                };
                var reward = new Reward(reward);
            }
            else {
                reward.rewards = rewards;
                reward.outlets = program.outlets;
                reward.status = program.status;
                reward.modified_date = Date.now();
            }
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
                        var reward = {
                            tier: null,
                            offer: null,
                            count: null,
                            reward: null,
                            rewardified: null
                        };

                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                            if ((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                                reward.count = lim + 1;
                                reward.tier = program.tiers[i]._id;
                                reward.offer = program.tiers[i].offers[j]._id;
                                reward.reward = program.tiers[i].offers[j].basics.title;
                                reward.rewardified = Utils.rewardify(program.tiers[i].offers[j]);
                                rewards.push(reward);
                            }
                        }
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {

                            if (lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                reward.count = lim + 1;
                                reward.tier = program.tiers[i]._id;
                                reward.offer = program.tiers[i].offers[j]._id;
                                reward.reward = program.tiers[i].offers[j].basics.title;
                                reward.rewardified = Utils.rewardify(program.tiers[i].offers[j]);
                                rewards.push(reward);
                            }
                        }
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                            if (lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                reward.count = lim + 1;
                                reward.tier = program.tiers[i]._id;
                                reward.offer = program.tiers[i].offers[j]._id;
                                reward.reward = program.tiers[i].offers[j].basics.title;
                                reward.rewardified = Utils.rewardify(program.tiers[i].offers[j]);
                                rewards.push(reward);
                            }
                        }
                    }
                }
            }
        }
    }
    return getSortedUniqueRewards(rewards);
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