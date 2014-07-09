var mongoose = require('mongoose');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier'); 
var Tag = mongoose.model('Tag');
var Outlet = mongoose.model('Outlet');
var Checkin = mongoose.model('Checkin');
var Favourite = mongoose.model('Favourite');
var ReccoConfig = mongoose.model('ReccoConfig');
var CommonUtilities = require('../../common/utilities');

var _ = require('underscore'); 
var async = require('async');

var RECCO_CONFIG = {
	USER_CHECKIN_WEIGHT : 5,
	NUMBER_OF_RECCO : 10,
	CHECKIN_CUTOFF_INTERVAL : 15,
	NORMALIZED_WEIGHT : 100,
	OUTLET_POPULARITY_WEIGHT : 100,
	RELEVANCE_MATCH_WEIGHT : 100,
	DISTANCE_WEIGHT : 100
};

module.exports.getRelevantPrograms = function (callback) {
	getActivePrograms();
	function getActivePrograms () {
		Program.find({'status': 'active'})
			.populate('tiers')
			.populate('outlets')
			.exec(function (err, programs) {
				if(err || programs.length === 0) {
					callback([]);
				}
				else {
					filterExpiredPrograms(programs);
				}
		});
	}

	function filterExpiredPrograms (filtered_set) {
		_(filtered_set).reject(function(program) {
			return (
				new Date(program.validity.earn_end) < new Date()
			)
		});

		breakOnOutlets(filtered_set);
	}

	function breakOnOutlets (filtered_set) {
		var consideration_set = [];
		filtered_set.forEach(function (program) {
			if(program.outlets) {
				if(program.outlets.length > 0) {
					program.outlets.forEach(function (outlet) {
						var consideration_object = {};
						if(program.tiers.length > 0) {
							consideration_object.program = program;
							consideration_object.outlet = outlet;
							consideration_set.push(consideration_object);
						}
					});
					program.outlets = [];
				}
			}
		});

		callback(consideration_set);
	}
}

module.exports.updateReccoConfig = function (callback) {
	ReccoConfig.findOne({}, function (err, recco_config) {
		if(!err && recco_config) {
			RECCO_CONFIG = recco_config;
		}
		if(!recco_config) {
			var recco_config = new ReccoConfig(RECCO_CONFIG);
			recco_config.save();
		}
		callback(true);
	});
}

module.exports.getHistoryOfCheckins = function (req, filtered_set, callback) {
	var filtered_set_length = filtered_set.length;
	filtered_set.forEach(function (obj) {
		async.parallel({
		    CHECKIN_ON_OUTLET: function(cb) {
		    	var q = {
		    		outlet: obj.outlet._id,
					checkin_date: {
						$gt: new Date(Date.now() - RECCO_CONFIG.CHECKIN_CUTOFF_INTERVAL * 24 * 60 * 60 * 1000),
						$lt: new Date()
					}
		    	};
		    	getCheckinCount(q, cb);
		    },
		    USER_CHECKIN_ON_PROGRAM: function(cb) {
		    	if(req.user && req.user.phone) {
		    		var q = {
			    		checkin_program: obj.program._id, 
			    		phone: req.user.phone
			    	};
			    	getCheckinCount(q, cb);
		    	}
		    	else {
		    		cb(null, 0);
		    	}
		    }
		}, function(err, count) {
			obj.count = count;
			if(--filtered_set_length === 0) {
				callback(filtered_set);
			}
		});
	});

	function getCheckinCount (q, cb) {
		Checkin.count(q, function (err, count) {
			cb(null, count || 0);
		})
	}
}

module.exports.getRelevanceForUser = function (refined_set) {
	refined_set.forEach(function (obj) {
		var relevant_tier = null;
		var relevant_count = 100000; // Some max value
		obj.program.tiers.forEach (function (tier) {					
			// The consideration count
			var considered_count = tier.basics.end_value - obj.count.USER_CHECKIN_ON_PROGRAM;

			if(considered_count > 0) {
				if(relevant_count >= considered_count) {
					obj.relevant_tier = tier;
					relevant_count = considered_count;
				}
			}
		});
	})

	return refined_set;
}

module.exports.getUserCheckinsAndFavs = function (req, callback) {
	var user_history_obj = {};
	user_history_obj.checkins = [];
	user_history_obj.favourites = [];

	async.parallel({
		    CHECKINS: function(cb) {
		    	if(req.user && req.user.phone) {
		    		var q = { 
			    		phone: req.user.phone
			    	};
			    	getUserCheckins(q, cb);
		    	}
		    	else {
		    		cb(null, []);
		    	}
		    },
		    FAVOURITES: function(cb) {
		    	if(req.user) {
		    		var q = {
			    		account: req.user._id
			    	};
			    	getUserFavs(q, cb);
		    	}
		    	else {
		    		cb(null, []);
		    	}
		    }
		}, function(err, result) {
			user_history_obj.checkins = result.CHECKINS;
			user_history_obj.favourites = result.FAVOURITES;
			callback(user_history_obj)
		});

	function getUserCheckins (q, cb) {
		Checkin.find(q)
			.populate('outlet')
			.populate('checkin_for')
			.exec(function (err, checkins) {
				cb(null, checkins || []);
		});
	}

	function getUserFavs (q, cb) {
		Favourite.find(q)
			.populate('outlets')
			.populate('offers')
			.exec(function(err, favourites) {
				cb(null, favourites || []);
		});
	}
}

module.exports.getUserTags = function (user_history_obj) {
	
	var total_tags = [];

	if(user_history_obj.checkins.length > 0) {
		user_history_obj.checkins.forEach(function (obj) {
			total_tags = total_tags.concat(CommonUtilities.getOutletAttributes(
					obj.outlet
				));
		});
	}
	if(user_history_obj.favourites.length > 0) {
		user_history_obj.checkins.forEach(function (obj) {
			if(obj.checkin_for && obj.checkin_for.tags) {
				total_tags = total_tags.concat(obj.checkin_for.tags || []);
			}
		});
	}

	return total_tags;
}

module.exports.getReducedTags =  function (user_prefered_tags) {
	var reduced_tags = _.reduce(user_prefered_tags, function(reduced_tags, tag) { 
		if (reduced_tags[tag]) { 
			reduced_tags[tag] = reduced_tags[tag] + 1; 
		} else { 
			reduced_tags[tag] = 1; 
		} 
		return reduced_tags; 
	}, {});

	return reduced_tags;
}

module.exports.getSortedTags = function (reduced_tags) {
	var sorted_tags = _.map(
		_.sortBy(_.pairs(reduced_tags), function (tags){
			return -tags[1]
		}), function(item) { 
			return {
				tag: item[0], 
				count:item[1]
			}
	});

	return sorted_tags;
}

module.exports.populateRelevantTier = function (relevant_set, callback) {
	var num_of_relevant_objects = relevant_set.length;
	relevant_set.forEach(function (obj) {
		var tier = obj.relevant_tier;
		var outlet = obj.outlet;

		if(tier) {
			Tier.findOne({_id: tier._id}).populate('offers').exec(function (err, result) {
				if(err || tier === null) {
					removeRelevantObject(obj);
				}
				else {
					obj.relevant_tier = result;
					obj.relevant_tier = result;
					obj.relevant_tag_set = getRelevantTags(result, outlet);
				}
				if(--num_of_relevant_objects === 0) {
					callback(relevant_set);
				}
			});
		}
		else {
			removeRelevantObject(obj);
			if(--num_of_relevant_objects === 0) {
				callback(relevant_set);
			}
		}
	});

	function removeConsiderationObject(obj) {
		_(consideration_set).reject(function(el) {return el === obj });
	}

	function getRelevantTags(tier, outlet) {
		var relevant_tag_set = [];
		if(outlet.attributes && outlet.attributes.tags) {
			relevant_tag_set = relevant_tag_set.concat(CommonUtilities.getOutletAttributes(
					outlet
				));
		}
		if(tier.offers.length > 0) {
			tier.offers.forEach (function (offer) {
				relevant_tag_set = relevant_tag_set.concat(offer.tags || []);
			});
		}
		return _.uniq(relevant_tag_set);
	}
}

module.exports.reccoComputation = function (req, populated_set, sorted_tags) {
	var user_loc, outlet_loc;
	populated_set.forEach(function (obj) {
		
		if(obj.outlet
			&& obj.outlet.contact
			&& obj.outlet.contact.location
			&& obj.outlet.contact.location.coords
			&& obj.outlet.contact.location.coords.longitude
			&& obj.outlet.contact.location.coords.latitude) {

			outlet_loc = obj.outlet.contact.location.coords;
			outlet = obj.outlet;
		}

		if(req.user 
			&& req.user.home
			&& req.user.home.longitude
			&& req.user.home.latitude) {

			user_loc = req.user.home;
			user = req.user;
		}
		else {
			user_loc = {
				latitude: req.params.latitude,
				longitude: req.params.longitude
			}
		}
		
		if(!_.isEmpty(user_loc) && !_.isEmpty(outlet_loc)) {
			obj.distance = CommonUtilities.calculateDistance(user_loc, outlet_loc);
			user_loc = null;
			outlet_loc = null;	
		}
		else {
			obj.distance = 100;
		}

		obj.match = calculateMatch(
			obj.relevant_tag_set, sorted_tags);
	});

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
		
		return match; // Scale it on 100
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

module.exports.universeCheckin = function (callback) {
	Checkin.count({checkin_date: {
			$gt: new Date(Date.now() - RECCO_CONFIG.CHECKIN_CUTOFF_INTERVAL * 24 * 60 * 60 * 1000),
			$lt: new Date()
		}}, function (err, count) {
			callback(count || 0);
	});
}

module.exports.normalizeSet = function (populated_set, universe_checkin_count) {

	var normalized_weight;

	populated_set.forEach(function (obj) {
		normalized_weight = RECCO_CONFIG.NORMALIZED_WEIGHT;

		if(obj.distance > 0){
			normalized_weight += (RECCO_CONFIG.DISTANCE_WEIGHT - obj.distance);
		}
		if(obj.count.USER_CHECKIN_ON_PROGRAM > 0) {
			normalized_weight += obj.count.USER_CHECKIN_ON_PROGRAM * RECCO_CONFIG.USER_CHECKIN_WEIGHT;
		}
		if(obj.match > 0) {
			normalized_weight += obj.match * RECCO_CONFIG.RELEVANCE_MATCH_WEIGHT;
		}
		if(obj.count.CHECKIN_ON_OUTLET > 0) {
			normalized_weight += (obj.count.CHECKIN_ON_OUTLET / universe_checkin_count) * RECCO_CONFIG.OUTLET_POPULARITY_WEIGHT;
		}

		obj.normalized_weight = normalized_weight;
	});

	return sortNormalize(populated_set);

	function sortNormalize (populated_set) {
		var sorted_populated_set = _.sortBy(populated_set, function (obj) {
			return -obj.normalized_weight;
		});

		var recommendations;

		recommendations = _.first(sorted_populated_set, RECCO_CONFIG.NUMBER_OF_RECCO);
		return recommendations;
	}
}