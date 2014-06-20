var mongoose = require('mongoose');
var ReccoConfig = mongoose.model('ReccoConfig');
var _ = require('underscore');

var RECCO_CONFIG = {
	USER_CHECKIN_WEIGHT : 5,
	NUMBER_OF_RECCO : 10,
	CHECKIN_CUTOFF_INTERVAL : 15,
	NORMALIZED_WEIGHT : 100,
	OUTLET_POPULARITY_WEIGHT : 100,
	RELEVANCE_MATCH_WEIGHT : 100,
	DISTANCE_WEIGHT : 100
};

module.exports.read = function(req, res) {
	ReccoConfig.findOne({}, function(err, recco_config) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting config',
						'info': err
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got config ',
						'info': recco_config
			});
		}
	}) 
};

module.exports.update = function(req, res) {
	var updated_recco_config = {};
	updated_recco_config = _.extend(updated_recco_config, req.body);
	updated_recco_config.USER_CHECKIN_WEIGHT = updated_recco_config.USER_CHECKIN_WEIGHT	|| RECCO_CONFIG.USER_CHECKIN_WEIGHT;
	updated_recco_config.NUMBER_OF_RECCO = updated_recco_config.NUMBER_OF_RECCO	|| RECCO_CONFIG.NUMBER_OF_RECCO;
	updated_recco_config.CHECKIN_CUTOFF_INTERVAL = updated_recco_config.CHECKIN_CUTOFF_INTERVAL	|| RECCO_CONFIG.CHECKIN_CUTOFF_INTERVAL;
	updated_recco_config.NORMALIZED_WEIGHT = updated_recco_config.NORMALIZED_WEIGHT	|| RECCO_CONFIG.NORMALIZED_WEIGHT;
	updated_recco_config.OUTLET_POPULARITY_WEIGHT = updated_recco_config.OUTLET_POPULARITY_WEIGHT	|| RECCO_CONFIG.OUTLET_POPULARITY_WEIGHT;
	updated_recco_config.RELEVANCE_MATCH_WEIGHT = updated_recco_config.RELEVANCE_MATCH_WEIGHT	|| RECCO_CONFIG.RELEVANCE_MATCH_WEIGHT;
	updated_recco_config.DISTANCE_WEIGHT = updated_recco_config.DISTANCE_WEIGHT	|| RECCO_CONFIG.DISTANCE_WEIGHT;
	delete updated_recco_config._id
	ReccoConfig.findOneAndUpdate(
		{}, 
		{$set: updated_recco_config }, 
		{upsert:true},
		function(err, recco_config) {
			if (err) {
				res.send(400, {	'status': 'error',
							'message': 'Update has failed. ',
							'info': err
				});
			} else {
				res.send(200, {	'status': 'success',
							'message': 'Successfully updated the outlet ',
							'info': recco_config
				});
			}
		});
};