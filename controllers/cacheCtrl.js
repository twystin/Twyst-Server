var cache = require('memory-cache');

cache.clear();

module.exports.setCache = function (key, data) {
	cache.put(key, data, 6 * 60 * 60 * 1000);
}

module.exports.getCache = function (key) {
	return cache.get(key);
}