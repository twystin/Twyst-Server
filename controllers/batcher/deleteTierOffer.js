var mongoose = require('mongoose');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');

module.exports.delTierOffer = function (tiers) {
	if(tiers.length <= 0) {

	}
	else {
		tiers.forEach(function (tier) {
			readTier(tier);
		})
	}

	function readTier (id) {
		Tier.findOne({_id: id}, function (err, tier) {
			if(err) {

			}
			else {
				if(tier && tier.offers) {
					if(tier.offers.length > 0) {
						var offers = tier.offers;
						dealOffers(offers);
					}
					tier.remove();
				}
			}
		});
	}

	function dealOffers (offers) {
		offers.forEach(function (offer) {
			deleteOffer(offer);
		});
	}

	function deleteOffer (id) {
		Offer.findOneAndRemove({_id: id}, function (err, tier) {
			if(err) {
				console.log(err);
			}
			else {
				// Done
			}
		})
	}
}