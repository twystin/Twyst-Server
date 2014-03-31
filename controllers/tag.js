var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');

module.exports.create = function(tags, outlet_id) {

	tags.forEach(function (element) {
		var new_tag = {};
		new_tag.outlets = [];
		new_tag.offers = [];
		Tag.findOne({name: element}, function(err,tag) {
			if (err) {
				console.log("Error getting tag");
			} else {
				if(tag === null) {
					new_tag.name = element;
					if(outlet_id) {
						new_tag.outlets.push(outlet_id);
					}
					var tag = new Tag(new_tag);
					tag.save();
				}
				else {
					if(outlet_id) {
						tag.outlets.push(outlet_id);
					}
					tag.save();
				}
			}
		})
	})
};

module.exports.createOfferTag = function(tags, offer_id) {

	tags.forEach(function (element) {
		var new_tag = {};
		new_tag.outlets = [];
		new_tag.offers = [];
		Tag.findOne({name: element}, function(err,tag) {
			if (err) {
				console.log("Error getting tag");
			} else {
				if(tag === null) {
					new_tag.name = element;
					if(offer_id) {
						new_tag.offers.push(offer_id);
					}
					var tag = new Tag(new_tag);
					tag.save();
				}
				else {
					if(offer_id) {
						tag.offers.push(offer_id);
					}
					tag.save();
				}
			}
		})
	})
};