var mongoose = require('mongoose');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');


module.exports.getFrequencyCheckins = function (req, res) {
    var program_id = req.params.program_id;
    var checkin = true;
    var voucher = false;
    readProgram(program_id, res, checkin, voucher);
}

function readProgram(program_id, res, checkin, voucher) {
    Program.findOne({_id: program_id}).populate('tiers').exec(function (err, program) {
        if(err) {
            res.send(400, {
                'status': 'error',
                'message': 'Error getting programs',
                'info': JSON.stringify(err)
            });
        }
        else {
            if (!program) {
                res.send(200, {
                    'status': 'success',
                    'message': 'Program not found',
                    'info': JSON.stringify(programs)
                });
            }
            else {
                if(checkin) {
                    getAllCheckins(program, res);
                }
                if(voucher) {
                    getAllVouchers(program, res);
                }
            }
        }
    });
};



function getAllCheckins(program, res) {

    var results = [];
    var result = {};
    var len = program.tiers.length;
    program.tiers.forEach(function (tier) {
        checkinData(tier);
    });

    function checkinData(tier) {
        Checkin.aggregate({ $match: { checkin_for: {
                        $in: tier.offers.map(
                            function(id){ 
                                return mongoose.Types.ObjectId(String(id)); 
                        })}}
                    },
                    {$project: {
                        weekperiod: {
                            $week: "$created_date"                            
                        },
                        phone:1
                    }},
                    { $group: 
                        {   _id: {
                                phone: '$phone',                                 
                                week: "$weekperiod"
                            }, 
                            count: { $sum: 1 }
                        }
                    }, function (err, op) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            console.log(op);
                        }
        })
    }
}