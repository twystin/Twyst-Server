var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twyst');
require('../config/config_models')();
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var async = require('async');
var Reward = mongoose.model('Reward');
var CommonUtilities = require('../common/utilities');
createRewardTable()
 function createRewardTable(program_id) {
    var program_id = "537b648fc1844b7c5400000f"
    if(!program_id) {
        console.log("I can t do anything");
    }
    else {
        getProgram(program_id, function (err, program) {
            if(err) {
                console.log("Error getting program...");
            }
            else {
                if(!program) {
                    console.log("Program not found");
                }
                else {
                    populateProgram(program, function (err, program) {
                        if(err) {
                            console.log("Error in populating program");
                        }
                        else {
                            var rewards = getRewards(program);
                            saveReward(program, rewards, function (err, success) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("Program exited successfully");
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
                    rewards:  rewards
                };
                var reward = new Reward(reward);
            }
            else {
                reward.rewards = rewards;
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
                            reward: null
                        };

                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                            if ((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                                reward.count = lim + 1;
                                reward.tier = program.tiers[i]._id;
                                reward.offer = program.tiers[i].offers[j]._id;
                                reward.reward = CommonUtilities.rewardify(program.tiers[i].offers[j]);
                                rewards.push(reward);
                            }
                        }
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {

                            if (lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                reward.count = lim + 1;
                                reward.tier = program.tiers[i]._id;
                                reward.offer = program.tiers[i].offers[j]._id;
                                reward.reward = CommonUtilities.rewardify(program.tiers[i].offers[j]);
                                rewards.push(reward);
                            }
                        }
                        if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                            if (lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                reward.count = lim + 1;
                                reward.tier = program.tiers[i]._id;
                                reward.offer = program.tiers[i].offers[j]._id;
                                reward.reward = CommonUtilities.rewardify(program.tiers[i].offers[j]);
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