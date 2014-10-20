var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twyst');
var async = require('async');
require('../config/config_models')();
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');
var _ = require('underscore');
var async = require('async');
var TagCtrl = require('../controllers/tag');
var Reward = mongoose.model('Reward');

var program = {};
var errs = [];

/*var req={
	params: {
		program_id: "535fb8feb7f678a830000046" 
	}
}*/

module.exports.createRewardTable = function(req) {
//function createRewardTable (req) {
    
    var record = {
        program: req.params.program_id,
        created_date: Date.now(),
        modified_date: Date.now(),
        rewards: []
    };

    Program.findOne({
            _id: req.params.program_id
        })
        .populate('tiers')
        .exec(function(err, program) {
            if (err) {
                console.log(err);
            } else {
                if (program) {
                    program = program.toObject();
                    populateTiers(program, function(err, populated_program) {
                        var p = [];
                        p.push(populated_program);
                        if (err) {
                            console.log(err);
                        } else {
                            createRewards(program, function(err){
                            record.rewards = _.uniq(record.rewards, function(obj) {
                                return obj.checkin_count;
                            });

                            record.rewards = _.sortBy(record.rewards, function(obj) {
                                return obj.checkin_count;
                            });
                            Reward.create({
                                    program: req.params.program_id,
                                    created_date: Date.now(),
                                    modified_date: Date.now(),
                                    rewards: record.rewards
                                }, function(err, small) {
                                    if (err) {
                                        console.log(err);
                                    }
                                })
                        	});
                        }
                    })
                } else {
                    //error handling
                }
            }
        })

    function createRewards(program, cb) {
        for (var i = 0; i < program.tiers.length; i++) {
            if (program.tiers[i]) {
                for (var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
                    for (var j = 0; j < program.tiers[i].offers.length; j++) {
                        if (program.tiers[i].offers[j]) {
                            var reward = {
                                tier: '',
                                offer: '',
                                checkin_count: ''
                            };

                            if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
                                if ((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
                                    reward.checkin_count = lim;
                                    reward.tier = program.tiers[i]._id;
                                    reward.offer = program.tiers[i].offers[j]._id;
                                    record.rewards.push(reward);
                                }
                            }
                            if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {

                                if (lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                    reward.checkin_count = lim;
                                    reward.tier = program.tiers[i]._id;
                                    reward.offer = program.tiers[i].offers[j]._id;
                                    record.rewards.push(reward);
                                }
                            }
                            if (program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
                                if (lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
                                    reward.checkin_count = lim;
                                    reward.tier = program.tiers[i]._id;
                                    reward.offer = program.tiers[i].offers[j]._id;
                                    record.rewards.push(reward);
                                }
                            }
                        }
                    }
                }
            }
        }
        cb(program);
    }

    function populateTiers(program, cb) {
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
                    program.tiers = tiers;
                    cb(null, program);
                }
            })
    }
}