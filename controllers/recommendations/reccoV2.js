var mongoose = require('mongoose');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');
var Outlet = mongoose.model('Outlet');
var Checkin = mongoose.model('Checkin');
var Favourite = mongoose.model('Favourite');

var _ = require('underscore');

module.exports.considerationSet = function(req, res) {
	
	// Declared consideration object here
	var consideration_set = [];
	var consideration_object = {};
	var num_of_programs = 0;
	var num_of_consideration_objects = 0;
	var phone = '';
	
	if (req.user) {
		phone = req.user.phone;
	}

	// Call the function
	getAllPrograms();
	
	// Get all programs here
	function getAllPrograms () {
		Program.find({'status': {$ne: 'draft'}, 'status': {$ne: 'archived'}}).populate('tiers').populate('outlets').exec(function (err, programs) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting Recommendation',
					'info': JSON.stringify(err)
				});
			}
			else {
				num_of_programs = programs.length;
				if(num_of_programs === 0) {
					res.send(200, {
						'status': 'error',
						'message': 'Error getting Recommendation',
						'info': ''
					});
				}
				else {
					breakProgramOnOutlets(programs);
					//getCheckinCounts(programs);
				}				
			}
		});
	}

	function breakProgramOnOutlets(programs) {
		programs.forEach(function (program) {
			if(program.outlets) {
				if(program.outlets.length > 0) {
					program.outlets.forEach(function (outlet) {
						if(program.tiers.length > 0) {
							consideration_object.program = program;
							consideration_object.outlet = outlet;
							consideration_set.push(consideration_object);
							consideration_object = {};
						}
					});
					program.outlets = [];
				}
			}
			num_of_programs--;
			if(num_of_programs === 0) {
				getCheckinCounts (consideration_set);
			}
		});
	}

	function getCheckinCounts (consideration_set) {
		num_of_consideration_objects = consideration_set.length;
		consideration_set.forEach(function (consideration_object) {
			countCheckinForOutlet(consideration_object);
			
		});
	}

	function countCheckinForOutlet(consideration_object) {

		var outlet_checkin_count = 0;

		var outlet = consideration_object.outlet;
		var program = consideration_object.program;

		if(outlet){
			Checkin.count({
				outlet: outlet._id,
				checkin_date: {
					$gt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
					$lt: new Date()
				}
			}, function (err, outlet_checkin_count) {
				
				if(err) {
					outlet_checkin_count = 0;
				}
				
				countCheckinForProgram(program, outlet, outlet_checkin_count);
			});
		}
		else {
			countCheckinForProgram(program, outlet, outlet_checkin_count);
		}
	}

	function countCheckinForProgram(program, outlet, outlet_checkin_count) {
		
		var count = 0;
		if(req.user && req.user.phone){
			Checkin.count({checkin_program: program._id, phone: phone}, function (err, count) {
				
				if(err) {
					count = 0;
				}
				
				getRelevantTier(program, outlet, count, outlet_checkin_count);
			});
		}
		else {
			getRelevantTier(program, outlet, count, outlet_checkin_count);
		}
	}

	function getRelevantTier (program, outlet, count, outlet_checkin_count) {
		
		var relevant_tier = null;
		var relevant_count = 100000; // Some max value
		var num_of_tiers = 0;

		if(program.tiers) {
			num_of_tiers = program.tiers.length;
			if(num_of_tiers > 0) {
				program.tiers.forEach (function (tier) {
					
					// The consideration count
					considered_count = tier.basics.end_value - count;

					if(considered_count > 0) {
						if(relevant_count >= considered_count) {
							relevant_tier = tier;
							relevant_count = considered_count;
						}
					}

					num_of_tiers--;

					if(num_of_tiers === 0) {
						var index = returnObjIndex(program, outlet);
						if(index > -1) {
							setTierAndCheckinCount(index, relevant_tier, count, outlet_checkin_count);							
						}
					}
				});
			}
			else {
				// Do nothing
			}
		}
		else {
			// Do nothing
		}
		--num_of_consideration_objects;
		if(num_of_consideration_objects === 0) {
			userPreferences(consideration_set, req, res);
		}
	}

	function setTierAndCheckinCount(index, relevant_tier, count, outlet_checkin_count) {
		consideration_set[index].relevant_tier = relevant_tier;
		consideration_set[index].checkin_count = count;
		consideration_set[index].outlet_checkin_count = outlet_checkin_count;
	}
	// Problem lies here
	function returnObjIndex(program, outlet) {
		var length = consideration_set.length;
		for(var i = 0; i < length; i++ ) {
			if(consideration_set[i].program === program && consideration_set[i].outlet === outlet) {
				return i;
			}
		}
		return -1;
	}
}

function getOutletAttributes (outlet) {

	var attributes = [];
	
	if(outlet.attributes)  {
		_.each( outlet.attributes, function( val, key ) {
			if(key === "cost_for_two" || key === "timings" || key === "toObject") {

			}
			else if (key === "tags") {
				attributes = attributes.concat(val);
			}
			else if(key === "cuisines" || key === "payment_options") {
				attributes = attributes.concat(val);
			}
			else if(key === "wifi" && (val === "Free" || val === "Paid")) {
				attributes.push(key);
			}
			else if(key === "parking" && (val === "Available" || val === "Valet")) {
				attributes.push(key);
			}
			else if(key === "air_conditioning" && (val === "Available" || val === "Partial")) {
				attributes.push(key);
			}
			else {
				if ( val ) {
					attributes.push(key);
				}
			}
		});
	}
	return _.uniq(attributes);
}

function userPreferences (consideration_set, req, res) {

	var user_preferenced_tags = [];
	var user;

	if(req.user) {
		user = req.user;
		getUserCheckins(user);
	}
	else {
		populateRelevantTiers(consideration_set, user_preferenced_tags, req, res)
	}

	function getUserCheckins (user) {
		Checkin.find({phone: user.phone}).populate('outlet').populate('checkin_for').exec(function (err, checkins) {
		
			// Initialize the checkins to empty array in error case
			if(err) {
				checkins = [];
			}

			// Get number of Checkins
			var num_of_checkins = checkins.length;

			// If user has checkins, Get the tags
			if(num_of_checkins > 0){
				getTagsForCheckins(checkins, num_of_checkins);
			}
			// Else get user Favorites
			else {
				getUserFavourites(user);
			}
		});
	}

	function getTagsForCheckins (checkins, num_of_checkins) {
		
		for(var j = 0; j < num_of_checkins; j++) {
			if(checkins[j].outlet) {
				if(checkins[j].outlet.attributes && checkins[j].outlet.attributes.tags) {
					if(checkins[j].outlet.attributes.tags.length > 0) {
						user_preferenced_tags = user_preferenced_tags.concat(getOutletAttributes (checkins[j].outlet));
					}
				}
			}
			if(checkins[j].checkin_for) {
				if(checkins[j].checkin_for.tags) {
					if(checkins[j].checkin_for.tags.length > 0) {
						user_preferenced_tags = user_preferenced_tags.concat(checkins[j].checkin_for.tags);
					}
				}
			}
			if(j === num_of_checkins-1) {
				getUserFavourites(user);
			}
		}
	}

	function getUserFavourites (user) {
	
		Favourite.find({account: user._id}).populate('outlets').populate('offers').exec(function(err,favourites) {
			// Initialize the checkins to empty array in error case
			if (err) {
				favourites = [];
			}

			// Get number of Favourites
			var num_of_favourites = favourites.length;

			// If user has favourites, Get the tags
			if(num_of_favourites > 0){
				getTagsForFavourites(favourites, num_of_favourites);
			}
			// Else reduce tags
			else {
				reduceTags(user_preferenced_tags);
			}
		});
	}

	function getTagsForFavourites (favourites, num_of_favourites) {
		for(var j = 0; j < num_of_favourites; j++) {
			if(favourites[j].outlet) {
				if(favourites[j].outlet.attributes && favourites[j].outlet.attributes.tags) {
					if(favourites[j].outlet.attributes.tags.length > 0) {
						user_preferenced_tags = user_preferenced_tags.concat(getOutletAttributes (favourites[j].outlet));
					}
				}
			}
			if(favourites[j].offers) {
				if(favourites[j].offers.tags) {
					if(favourites[j].offers.tags.length > 0) {
						user_preferenced_tags = user_preferenced_tags.concat(favourites[j].offers.tags);
					}
				}
			}
			// Reduce tags here
			if(j === num_of_favourites-1) {
				reduceTags(user_preferenced_tags);
			}
		}
	}

	function reduceTags (user_preferenced_tags) {

		//Reduce tags to name and thier count
		var reduced_tags = _.reduce(user_preferenced_tags, function(reduced_tags, tag) { 
			if (reduced_tags[tag]) { 
				reduced_tags[tag] = reduced_tags[tag] + 1; 
			} else { 
				reduced_tags[tag] = 1; 
			} 
			return reduced_tags; 
		}, {});

		sortTags(reduced_tags);
	}

	function sortTags (reduced_tags) {

		// Sort tags based upon their count
		var user_preferenced_tags = _.map(
			_.sortBy(_.pairs(reduced_tags), function (tags){
				return -tags[1]
			}), function(item) { 
				return {
					tag: item[0], 
					count:item[1]
				}
		});

		populateRelevantTiers(consideration_set, user_preferenced_tags, req, res);
	}
}

function populateRelevantTiers(consideration_set, user_preferenced_tags, req, res) {
	
	var tier;
	var outlet;
	num_of_consideration_objects = consideration_set.length;

	consideration_set.forEach(function (consideration_object) {
		tier = consideration_object.relevant_tier;
		outlet =consideration_object.outlet;

		consideration_object.match_tags_set = [];

		if(tier) {
			Tier.findOne({_id: tier._id}).populate('offers').exec(function (err, result) {
				if(err || tier === null) {
					removeConsiderationObject(consideration_object);
				}
				else {
					consideration_object.relevant_tier = result;
					consideration_object.match_tags_set = getTags(result, outlet);
				}
				--num_of_consideration_objects;
				if(num_of_consideration_objects === 0) {
					computationStep(consideration_set, user_preferenced_tags, req, res);
				}
			});
		}
		else {
			removeConsiderationObject(consideration_object);
			--num_of_consideration_objects;
			if(num_of_consideration_objects === 0) {
				computationStep(consideration_set, user_preferenced_tags, req, res);
			}
		}
	});

	function removeConsiderationObject(consideration_object) {
		_(consideration_set).reject(function(el) {return el === consideration_object });
	}

	function getTags(tier, outlet) {
		var match_tags_set = [];
		if(outlet.attributes && outlet.attributes.tags) {
			match_tags_set = match_tags_set.concat(outlet.attributes.tags);
		}
		if(tier.offers.length > 0) {
			tier.offers.forEach (function (offer) {
				if(offer.tags) {
					match_tags_set = match_tags_set.concat(offer.tags);
				}
			})
		}
		return _.uniq(match_tags_set);
	}
}

function computationStep(consideration_set, user_preferenced_tags, req, res) {

	var user_loc, user;
	var outlet_loc, outlet;

	num_of_consideration_objects = consideration_set.length;
	
	consideration_set.forEach(function (consideration_object) {
		
		if(consideration_object.outlet
			&& consideration_object.outlet.contact
			&& consideration_object.outlet.contact.location
			&& consideration_object.outlet.contact.location.coords
			&& consideration_object.outlet.contact.location.coords.longitude
			&& consideration_object.outlet.contact.location.coords.latitude) {

			outlet_loc = consideration_object.outlet.contact.location.coords;
			outlet = consideration_object.outlet;
		}

		if(req.user 
			&& req.user.home
			&& req.user.home.longitude
			&& req.user.home.latitude) {

			user_loc = req.user.home;
			user = req.user;
		}
		
		if(!_.isEmpty(user_loc) && !_.isEmpty(outlet_loc)) {
			consideration_object.distance = calculateDistance(user, outlet);
			user_loc = null;
			outlet_loc = null;	
		}
		else {
			consideration_object.distance = 0;
		}

		consideration_object.match = calculateMatch(
			consideration_object.match_tags_set, user_preferenced_tags);

		--num_of_consideration_objects;
		if(num_of_consideration_objects === 0) {
			countUniverseOfCheckins(consideration_set, res);
		}
	});
	
	function calculateDistance (user, outlet) {

		var p1 = {latitude: outlet.contact.location.coords.latitude, longitude: outlet.contact.location.coords.longitude};
        var p2 = {latitude: user.home.latitude, longitude: user.home.longitude};

		var R = 6371; // km
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function() {
                return this * Math.PI / 180;
            };
        }

        if (!p1 || !p2) {
            return 100; 
            //return null;
        }

        var dLat = (p2.latitude-p1.latitude).toRad();
        var dLon = (p2.longitude-p1.longitude).toRad();
        
        var lat1 = p1.latitude.toRad();
        var lat2 = p2.latitude.toRad();

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        console.log(d);
        if (d > 100) {
            return 100;
        }
        return d.toFixed(1);
	}

	function calculateMatch (match_tags_set, user_preferenced_tags) {
		
		var index;
		var matched_tags = 0;
		var match = 0;
		var user_preferenced_tags_count = 0;
		var user_preferenced_tags_length = user_preferenced_tags.length;
		var match_tags_set_length = match_tags_set.length;

		if(user_preferenced_tags_length > 0) {
			user_preferenced_tags.forEach (function (tag) {
				user_preferenced_tags_count += tag.count;
			})
		}

		if(match_tags_set_length > 0 && user_preferenced_tags_length > 0) {
			match_tags_set.forEach(function (tag) {
				index = indexOfTag(user_preferenced_tags, tag, user_preferenced_tags_length);
				
				if(index >= 0) {
					++matched_tags;
					match += user_preferenced_tags[index].count / user_preferenced_tags_count;
				}
			});
			match *= matched_tags / match_tags_set_length;
		}
		
		return match * 100; // Scale it on 100
	}

	function indexOfTag(user_preferenced_tags, tag, user_preferenced_tags_length) {
		for(var i = 0; i < user_preferenced_tags_length; i++ ) {
			if(user_preferenced_tags[i].tag === tag) {
				return i;
			}
		}
		return -1;
	}
}

function countUniverseOfCheckins (consideration_set, res) {

	var universe_checkin_count = 1;

	Checkin.count({
		checkin_date: {
			$gt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
			$lt: new Date()
		}
	}, function (err, count) {
		if(err || count <= 0) {
			universe_checkin_count = 1;
		}
		else {
			universe_checkin_count = count;
		}
		
		normalizeSet(consideration_set, universe_checkin_count, res);
	});
}

function normalizeSet (consideration_set, universe_checkin_count, res) {
	var normalized_weight;
	num_of_consideration_objects = consideration_set.length;

	consideration_set.forEach(function (consideration_object) {
		normalized_weight = 100;

		if(consideration_object.distance > 0){
			normalized_weight -= consideration_object.distance;
		}
		if(consideration_object.checkin_count > 0) {
			normalized_weight += consideration_object.checkin_count * 5;
		}
		if(consideration_object.match > 0) {
			normalized_weight += consideration_object.match;
		}
		if(consideration_object.outlet_checkin_count> 0) {
			normalized_weight += (consideration_object.outlet_checkin_count / universe_checkin_count) * 100;
		}

		consideration_object.normalized_weight = normalized_weight;

		--num_of_consideration_objects;
		if(num_of_consideration_objects === 0) {
			sortNormalize(consideration_set, res);
		}
	});

}

function sortNormalize (consideration_set, res) {
	var sorted_consideration_set = _.sortBy(consideration_set, function (obj) {
		return -obj.normalized_weight;
	});

	var recommendations;

	recommendations = _.first(sorted_consideration_set, 10);

	returnRecommendations(recommendations, res);
}

function returnRecommendations (recommendations, res) {
	
	res.send(200,{
		'status': 'success',
		'message': 'Got recommendations success',
		'info': JSON.stringify(recommendations)
	});
}