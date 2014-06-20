var Helper = require('./helper');
var _ = require('underscore');
var async = require('async');

module.exports.getRecco = function (req, res) {
	
	computeRecco(req, function (recommendations) {
		res.send(200,{
			'status': 'success',
			'message': 'Got recommendations success',
			'info': JSON.stringify(recommendations)
		}); 
	});
}

function computeRecco (req, callback) {
	getConsiderationSet(req, callback);
}

// Step 1 for Recco algo. Get the whole consideration set.

function getConsiderationSet (req, callback) {
	async.parallel({
		    RELEVANCE_SET: function(cb) {
		    	Helper.getRelevantPrograms(function (filtered_set) {
					cb(null, filtered_set);
				});
		    },
		    UPDATE_RECCO_CONFIG: function (cb) {
		    	Helper.updateReccoConfig(function (filtered_set) {
					cb(null, true);
				});
		    }
		}, function(err, result) {
			if(result.RELEVANCE_SET.length === 0) {
				callback(result.RELEVANCE_SET);
			}
			else {
				getHistoryOfCheckins(req, result.RELEVANCE_SET, callback);
			}
		});
}

// Step 2 for Recco algo. Get the History of checkins for 
// the Outlet as well as the user (on Program)

function getHistoryOfCheckins(req, filtered_set, callback) {
	Helper.getHistoryOfCheckins(req, filtered_set, function (refined_set) {
		getRelevanceForUser(req, refined_set, callback);
	});
}

// Step 3 for Recco algo. Get the Relevance of user 
// on current Program

function getRelevanceForUser(req, refined_set, callback) {
	var relevant_set = Helper.getRelevanceForUser(refined_set);
	getUserCheckinsAndFavs(req, relevant_set, callback);
}

// Step 4 for Recco algo. Get the User checkins
// and favourites

function getUserCheckinsAndFavs (req, relevant_set, callback) {
	Helper.getUserCheckinsAndFavs(req, function (user_history_obj) {
		getUserTags(req, relevant_set, user_history_obj, callback);
	});
}

// Step 5 for Recco algo. Get the User tags for
// checkins and favourites

function getUserTags(req, relevant_set, user_history_obj, callback) {
	var user_prefered_tags = Helper.getUserTags(user_history_obj);
	var reduced_tags = Helper.getReducedTags(user_prefered_tags);
	var sorted_tags = Helper.getSortedTags(reduced_tags);
	populateRelevantTier(req, relevant_set, sorted_tags, callback);
}

// Step 6 for Recco algo. Populate the relevant tier
// with its offers

function populateRelevantTier (req, relevant_set, sorted_tags, callback) {
	Helper.populateRelevantTier(relevant_set, function (populated_set) {
		reccoComputation(req, populated_set, sorted_tags, callback);
	});
}

// Step 7 for Recco algo. Computation step for recco algo

function reccoComputation (req, populated_set, sorted_tags, callback) {
	Helper.reccoComputation(req, populated_set, sorted_tags);
	countUniverseCheckin(populated_set, callback);
}

// Step 7 for Recco algo. Computation step for recco algo

function countUniverseCheckin(populated_set, callback) {
	Helper.universeCheckin (function (universe_checkin_count) {
		normalizeSet(populated_set, universe_checkin_count, callback);
	});
}

// Step 8 for Recco algo. Normalize the set and return back

function normalizeSet(populated_set, universe_checkin_count, callback) {
	var reccos = Helper.normalizeSet(populated_set, universe_checkin_count);
	callback(reccos);
}