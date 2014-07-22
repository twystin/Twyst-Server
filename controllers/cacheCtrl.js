var cache = require('memory-cache');

console.log("Clearing data cache from memory :)");
cache.clear();

module.exports.setCache = function (key, data) {
	cache.put(key, data, 6 * 60 * 60 * 1000);
}

module.exports.getCache = function (key) {
	return cache.get(key);
}

module.exports.clear = function () {
	cache.clear();
	return true;
}