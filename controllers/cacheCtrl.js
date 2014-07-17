var cache = require('memory-cache');

module.exports.setCache = function (key, data) {
	cache.put(key, data);
}

module.exports.getCache = function (key) {
	return cache.get(key);
}