var cache = require('memory-cache');

console.log("Clearing data cache from memory :)");
cache.clear();

module.exports.setCache = function (key, data) {
	cache.put(key, validateData(key, data), 6 * 60 * 60 * 1000);
}

module.exports.getCache = getCache = function (key) {
	return cache.get(key);
}

module.exports.clear = function () {
	cache.clear();
	return true;
}

function validateData (key, data) {
	var validatedData = getCache(key) || {};
	validatedData.loggedIn = data.loggedIn;
	if(data.RECCO && data.RECCO.info) {
		validatedData.RECCO = data.RECCO;
	}
	if(data.NEAR && data.NEAR.info) {
		validatedData.NEAR = data.NEAR;
	}
	if(data.CHECKINS && data.CHECKINS.info) {
		validatedData.CHECKINS = data.CHECKINS;
	}
	if(data.VOUCHERS && data.VOUCHERS.info) {
		validatedData.VOUCHERS = data.VOUCHERS;
	}
	if(data.FAVOURITES && data.FAVOURITES.info) {
		validatedData.FAVOURITES = data.FAVOURITES;
	}

	return validatedData;
}