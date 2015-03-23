var mongoose = require('mongoose');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore'); 


module.exports.read = function(req,res) {
	Offer.findOne({_id: req.params.offer_id}, function(err,offer) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting offer',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got offer ',
						'info': JSON.stringify(offer)
			});
		}
	}) 
};

module.exports.addOffer = function(req,res) {
	var tier_id = req.body.tier_id;
	var created_offer = {};
	created_offer = _.extend(created_offer, req.body.offer);
	var offer = new Offer(created_offer);
	delete offer.__v;
	offer.save(function(err, offer) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error saving offer',
						'info': JSON.stringify(err)
			});
		} else {
			Tier.findOne({_id: tier_id}, function (err, tier) {
				if(err) {
					res.send(400, {	'status': 'error',
								'message': 'Error saving tier',
								'info': JSON.stringify(err)
					});
				}
				else {
					if(tier.offers.length >= 0 ) {
						tier.offers.push(offer._id)
						delete tier.__v;
						tier.save(function (err) {
							if(err) {
								res.send(400, {	'status': 'error',
												'message': 'Error saving tier',
												'info': JSON.stringify(err)
									});
							}
							else {
								res.send(200, {	'status': 'success',
											'message': 'Saved offer',
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

module.exports.query = function(req,res) {
	Offer.find({username: req.params.username}, function(err,offers) { 
		if (err) {
			res.send(400,{'status': 'error',
						'message': 'Error getting list of offers',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {'status': 'success',
						'message': 'Got all offers',
						'info': JSON.stringify(offers)
			});
		}
	});
};

module.exports.update = function(req,res) {
	var updated_offer = {};
	updated_offer = _.extend(updated_offer, req.body.offer);
	delete updated_offer._id;
	delete updated_offer.__v;
	Offer.findOneAndUpdate(
		{_id:req.body.offer_id}, 
		{$set: updated_offer },
		{upsert:true},
		function(err,offer) {
		if (err) {
			res.send(400,{'status': 'error',
						'message': 'Error updating offer ' + req.body.offer_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, { 'status': 'success',
						'message': 'Successfully updated offer',
						'info': JSON.stringify(offer)
			});
		}
	});
};

module.exports.delete = function(req,res) {
    Offer.findOneAndRemove({
    	_id: req.params.offer_id
    }, function(err){
		if (err) {
			res.send(400, {'status': 'error',
						'message': 'Error deleting offer',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {'status': 'success',
						'message': 'Successfully deleted offer',
						'info': ''
			});
		}
	});
};