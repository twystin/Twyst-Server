var mongoose = require('mongoose');
var Tier = mongoose.model('Tier');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var _ = require('underscore');

module.exports.addTier = function(req,res) {
	var program_id = req.params.program_id;
	var created_tier = {};
	created_tier = _.extend(created_tier, req.body);
	var tier = new Tier(created_tier);

	tier.save(function(err, tier) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error saving tier',
						'info': JSON.stringify(err)
			});
		} else {
			Program.findOne({_id: program_id}, function (err, program) {
				if(err) {
					res.send(400, {	'status': 'error',
								'message': 'Error saving tier',
								'info': JSON.stringify(err)
					});
				}
				else {
					if(program.tiers.length >= 0 ) {
						program.tiers.push(tier._id)
						program.save(function (err) {
							if(err) {
								res.send(400, {	'status': 'error',
												'message': 'Error saving tier',
												'info': JSON.stringify(err)
									});
							}
							else {
								res.send(200, {	'status': 'success',
											'message': 'Saved tier',
											'info': ''
								});
							}
						})
					}
				}
			})
		}
	})
};

module.exports.deleteTier = function(req, res) {
    Tier.findOne({_id: req.params.tier_id}, function(err, tier){
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error deleting tier ',
						'info': JSON.stringify(err)
			});
		} else {
			if(tier.offers) {
				if(tier.offers.length > 0) {
					var offer_length = tier.offers.length;
					tier.offers.forEach(function (offer) {
						Offer.findOneAndRemove({_id: offer}, function (err) {
							if(err) {
								errs.push(err);
								offer_length--;
								if(offer_length === 0) {
									tierDelete(res, tier);
								}
							}
							else {
								offer_length--;
								if(offer_length === 0) {
									tierDelete(res, tier);
								}
							}
						})
					})
				}
				else {
					tierDelete(res, tier);
				}
			}
			else {
				tierDelete(res, tier);
			}
		}
	});
};

function tierDelete (res, tier) {
	Tier.findOneAndRemove({_id: tier._id}, function(err) {
		if(err) {
			res.send(400, {	'status': 'error',
						'message': 'Error deleting tier ',
						'info': JSON.stringify(err)
			});
		}
		else {
			res.send(200, {	'status': 'success',
						'message': 'Successfully deleted tier',
						'info': ''
			});
		}
	})
}

module.exports.query = function(req,res) {
	Tier.find({}, function(err,tiers) {
		if (err) {
			res.send({	'status': 'error',
						'message': 'Error getting list of tiers',
						'info': JSON.stringify(err)
			});
		} else {
			res.send({	'status': 'success',
						'message': 'Got all tiers',
						'info': JSON.stringify(tiers)
			});
		}
	});
};

module.exports.read = function(req,res) {
	Tier.find({slug: req.params.tier_id}, function(err,tier) {
		if (err) {
			res.send({	'status': 'error',
						'message': 'Error getting tier id ' + req.params.tier,
						'info': JSON.stringify(err)
			});
		} else {
			res.send({	'status': 'success',
						'message': 'Got tier ' + req.params.tier_id,
						'info': JSON.stringify(tier)
			});
		}
	});
};

module.exports.create = function(req,res) {
	var created_tier = {};
	created_tier = _.extend(created_tier, req.body);
	var tier = new Tier(created_tier);

	tier.save(function(err) {
		if (err) {
			res.send({	'status': 'error',
						'message': 'Error saving tier',
						'info': JSON.stringify(err)
			});
		} else {
			res.send({	'status': 'success',
						'message': 'Saved tier',
						'info': ''
			});
		}
	})
};

module.exports.update = function(req,res) {
	var updated_tier = {};
	updated_tier = _.extend(updated_tier, req.body);
	delete updated_tier.__v
	Tier.findOne({_id: req.params.tier_id}, function (err, tier) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error saving tier',
						'info': JSON.stringify(err)
			});
		} else {
			if(tier !== null) {
				tier.basics.name = updated_tier.basics.name;
				tier.basics.start_value = updated_tier.basics.start_value;
				tier.basics.end_value = updated_tier.basics.end_value;
				tier.save(function (err) {
					if(err) {
						res.send(400, {	'status': 'error',
									'message': 'Error saving tier',
									'info': JSON.stringify(err)
						});
					}
					else {
						res.send(200, {	'status': 'success',
									'message': 'Saved tier',
									'info': ''
						});
					}
				})
			}
			else {
				res.send(200, {	'status': 'success',
									'message': 'Saved tier',
									'info': ''
				});
			}
		}
	})
};
