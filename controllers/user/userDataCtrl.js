var http = require('http');
var async = require('async');
var _ = require('underscore');

var RecoCtrl = require('../../controllers/recommendations/reccoV2custom');
var RecoCtrl3 = require('../../controllers/recommendations/main');
var OutletCtrl = require('../../controllers/outlet');
var CacheCtrl = require('../cacheCtrl');
var UserCtrl = require('../user.js');
var CommonUtilities = require('../../common/utilities');

module.exports.getData = function (req, res) {

	var userCache = getFromCache();
	var current_loc = {
		latitude : Number(req.params.latitude),
		longitude : Number(req.params.longitude)
	}
	
	if(userCache) {
		if(!userCache.loggedIn && req.isAuthenticated()) {
			returnRefreshedData();
		}
		else if((userCache.lat && userCache.lon) 
				&& (current_loc.latitude && current_loc.longitude)) {
			var cache_loc = {
				'latitude': userCache.lat,
				'longitude': userCache.lon
			}
			var distance = CommonUtilities.calculateDistance(current_loc, cache_loc);
			
			if(distance >= 0.3) {
				returnRefreshedData();
			}
			else {
				res.send(200, {
			    	'status': "success",
			    	'message': 'Got data successfully',
			    	'info': userCache
			    })
			}
		}
		else {
			res.send(200, {
		    	'status': "success",
		    	'message': 'Got data successfully',
		    	'info': userCache
		    })
		}
	}
	else {
		returnRefreshedData();
	}	

	if(req.isAuthenticated() 
		&& (current_loc.latitude && current_loc.longitude)) {
		UserCtrl.setLocation(req.user._id, req.user.phone, current_loc);
	}

	function returnRefreshedData () {
		refreshData(req, function (status) {
			res.send(200, {
		    	'status': "success",
		    	'message': 'Got data successfully',
		    	'info': getFromCache()
		    })
		});
	}

	function getFromCache() {
		var data = CacheCtrl.getCache(req.sessionID);
		if(data && data.VOUCHERS) {
			data.VOUCHERS = filterVouchers(data.VOUCHERS);
		}
		return data;
	}

	function filterVouchers(vouchers) {
		var voucher_cutoff = 0;
		var info = vouchers.info;
		if(info && info.length > 0) {
			info.forEach (function (v) {
				if(new Date(v.basics.created_at) < new Date(Date.now() - 3 * 60 * 60 * 1000)) {
					++voucher_cutoff;
				}
			});
			info = _.first(info, voucher_cutoff);
			vouchers.info = info;
		}
		return vouchers;
	}
}

module.exports.refreshData = refreshData = function (req, cbRefresh) {

	var data = {};

	data.RECCO = {};
	data.NEAR = {};
	data.CHECKINS = {};
	data.VOUCHERS = {};
	data.FAVOURITES = {};
	data.loggedIn = req.isAuthenticated();
	data.lat = Number(req.params.latitude);
	data.lon = Number(req.params.longitude);

	async.parallel({
        RECCO: function(callback) {
            getReccos(callback);
        },
        NEAR: function(callback) {
            getNearby(callback);
        },
        CHECKINS: function(callback) {
            getCheckins(callback);
        },
        VOUCHERS: function(callback) {
            getVouchers(callback);
        },
        FAVOURITES: function(callback) {
            getFavourites(callback);
        }
    }, function(err, results) {
    	CacheCtrl.setCache(req.sessionID, data);
        cbRefresh(true);
    });

	function getReccos(callback) {

		RecoCtrl3.getRecco(req, function (obj) {
			data.RECCO = obj;
			if(data.RECCO.info && (typeof data.RECCO.info) == 'string') {
		    	data.RECCO.info = JSON.parse(data.RECCO.info);
		    }
		    callback(null, true);
		});
	}

	function getNearby (callback) {
		
		RecoCtrl.nearBy(req, function (obj) {
			data.NEAR = obj;
			if(data.NEAR.info && (typeof data.NEAR.info) == 'string') {
		    	data.NEAR.info = JSON.parse(data.NEAR.info);
		    }
		    callback(null, true);
		});
	}

	function getCheckins (callback) {
		
		RecoCtrl.myCheckins(req, function (obj) {
			data.CHECKINS = obj;
			if(data.CHECKINS.info && (typeof data.CHECKINS.info) == 'string') {
		    	data.CHECKINS.info = JSON.parse(data.CHECKINS.info);
		    }
		    callback(null, true);
		});
	}

	function getVouchers (callback) {
		
		RecoCtrl.myVouchers(req, function (obj) {
			data.VOUCHERS = obj;
			if(data.VOUCHERS.info && (typeof data.VOUCHERS.info) == 'string') {
		    	data.VOUCHERS.info = JSON.parse(data.VOUCHERS.info);
		    }
		    callback(null, true);
		});
	}

	function getFavourites (callback) {
		
		RecoCtrl.myFavourites(req, function (obj) {
			data.FAVOURITES = obj;
			if(data.FAVOURITES.info && (typeof data.FAVOURITES.info) == 'string') {
		    	data.FAVOURITES.info = JSON.parse(data.FAVOURITES.info);
		    }
		    callback(null, true);
		});
	}
}