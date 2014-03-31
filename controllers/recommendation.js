var mongoose = require('mongoose');
var Recommendation = mongoose.model('Recommendation');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');
var Outlet = mongoose.model('Outlet');
var Checkin = mongoose.model('Checkin');
var _ = require('underscore');

var tag_count = [];

module.exports.getRecommendedPrograms = function (req, res) {
	
	var phone = '';
	if(req.user) {
		phone = req.user.phone;
	}
	Checkin.find({phone: phone}).populate('outlet').populate('checkin_for').exec(function (err, checkins) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting recommendation',
				'info': JSON.stringify(err)
			})
		}
		else {
			var checkins_length = checkins.length;
			if(checkins_length > 0){
				for(var j = 0; j < checkins_length; j++) {
					if(checkins[j].outlet) {
						if(checkins[j].outlet.attributes.tags.length > 0) {
							tag_count = tag_count.concat(checkins[j].outlet.attributes.tags);
						}
					}
					if(checkins[j].checkin_for) {
						if(checkins[j].checkin_for.tags.length > 0) {
							tag_count = tag_count.concat(checkins[j].checkin_for.tags);
						}
					}
					if(j === checkins_length-1) {
						var memo = _.reduce(tag_count, function(memo, tag) { 
							if (memo[tag]) { 
								memo[tag] = memo[tag] + 1; 
							} else { 
								memo[tag] = 1; 
							} 
							return memo; 
						}, {});
						sortTags(req, res, memo);
					}
				}
			}
			else {
				var tagged_offers = [];
				fillRandomOffers(req, res, tagged_offers);
			}
		}
	});	
}

function sortTags (req, res, memo) {

	var sorted_memo = _.map(
		_.sortBy(_.pairs(memo), function (memo){
			return -memo[1]
		}), function(item) { 
			return {
				tag: item[0], 
				count:item[1]
			}
		});
	var sorted_memo = _.first(sorted_memo, 3);
	calculateProbables(req, res, sorted_memo);
}

function calculateProbables(req, res, sorted_memo)  {
	var total = 0;
	_.each(sorted_memo, function (value, key) {
		total += value.count;
	})
	
	_.each(sorted_memo, function (value, key) {
		value.count = Math.round((value.count*10) / total);
	})

	getOffersForTags(req, res, sorted_memo);
}

function getOffersForTags(req, res, sorted_memo) {
	var length = sorted_memo.length;
	var tagged_offers = [];
	var errs = [];

	Offer.count({}, function (err, obj) {
		if(obj <= 10) {
			Offer.find({}, function (err, offers) {
				if(err) {
					res.send(400, {
							status: "error",
							message: "Unbale to get recommendation",
							info: JSON.stringify(err)
					});
				}
				else {
					tagged_offers =  tagged_offers.concat(offers);
					if(tagged_offers.length > 0) {
						getTiersAndProgramsforOffers(req, res, tagged_offers);
					}
					else {
						res.send(200, {
								status: "success",
								message: "No recommendations",
								info: ''
						});
					}
					
				}
			})
		}
		else {
			var sorted_memo_length = sorted_memo.length;
			sorted_memo.forEach(function (item) {
				Tag.findOne({name: item.tag}, function (err, tag) {
					if(err) {
						errs.push(err);
					}
					else {
						if(tag !== null) {
							if(tag.offers.length > 0) {
								var search = [];
								tag.offers.forEach(function (offer) {
									search.push(mongoose.Types.ObjectId(String(offer)));
								});						 
								Checkin.aggregate({ 
									$match: {checkin_for: {$in: search}}}, 
									{ $group: { _id: '$checkin_for', count: {$sum: 1}}})
									.exec(function (err, result) {
										if(err) {
											errs.push(err);	
										}
										else {											
											if(result.length > 0) {												
												var cutoff_offer = _.first(result, item.count);
												
												tagged_offers = tagged_offers.concat(cutoff_offer);

												tagged_offers = _.uniq(tagged_offers, function( x ){
													return JSON.stringify( x );});												
											}

										}
								})
							}						
						}
						sorted_memo_length--;
						if (sorted_memo_length === 0) {	
							populateOffers(req, res, tagged_offers);
						}
					}
				})
			})
		}
	})
}

function populateOffers(req, res, tagged_offers) {	

	Offer.find({_id: {$in: tagged_offers.map(function(id){ 
		return mongoose.Types.ObjectId(String(id._id));})}}, 
		function (err, offers) {
		if(err) {

		}
		else {
			tagged_offers = offers;
			fillRandomOffers(req, res, tagged_offers)
		}
	})
}

function fillRandomOffers(req, res, tagged_offers) {
	Offer.find({_id: {$nin: tagged_offers.map(function(id){ 
		return mongoose.Types.ObjectId(String(id._id));})}}, 
		function (err, offers) {
		if(err) {

		}
		else {
			tagged_offers = tagged_offers.concat(offers);
			getTiersAndProgramsforOffers(req, res, tagged_offers);
		}
	})
}

function fillRandomOffers1(req, res, tagged_offers) {

	Offer.find({}, 
		function (err, offers) {
		if(err) {

		}
		else {
			tagged_offers = tagged_offers.concat(offers);
			getTiersAndProgramsforOffers(req, res, tagged_offers);
		}
	})
}
 
function getTiersAndProgramsforOffers(req, res, tagged_offers) {
	var recommended_programs = [];
	var recommended_program = {};
	var errs = [];
	var length = tagged_offers.length;

	tagged_offers.forEach(function (offer) {
		var recommended_program = {};
		Tier.findOne({offers: offer}, function (err, tier) {
			if(err) {
				errs.push(err);
			}
			else {
				Program.findOne({tiers: tier}).populate('outlets').exec(function (err, program) {
					if(err) {
						errs.push(err);
					}
					else {										
						recommended_program.tier = tier;
						recommended_program.offer = offer;
						recommended_program.program = program;
						recommended_programs.push(recommended_program);
						length--;
						if(length === 0) {
							res.send(200, {
								status: "success",
								message: "Got all recommendations",
								info: recommended_programs
							});
						}
					}
				})
 			}
		})
	})
}