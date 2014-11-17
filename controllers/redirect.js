var mongoose = require('mongoose');
var Redirect = mongoose.model('Redirect');
var Outlet = mongoose.model('Outlet');
var _ = require('underscore');
var url = require('url'),
	M = require('mstring');

module.exports.getRedirected = function (req, res) {
	
	var query = url.parse(req.url, true).search;
	var key = req.params.key;
	
	Redirect.findOne({key: key}, function (err, redirect) {
		if(err || redirect === null) {
			res.send(400, {
				'status': 'error',
				'message': 'wrong redirect url',
				'info': ''
			});
		}
		else {
			if((key === "checkin" || key === "download") && query){
				res.redirect(redirect.url+query);
			}
			else {
				res.redirect(redirect.url);
			}
		}
	});
}

module.exports.redirectToOutlet = function (req, res) {
	// Assuming outlet shorturl wont be bigger than 6 characres
	if(!req.params.shortUrl && !req.params.shortUrl.length > 6) {
		redirect(null, null);
	}
	Outlet.findOne({
		shortUrl: req.params.shortUrl.toUpperCase(),
		'outlet_meta.status': 'active'
	}, function (err, outlet) {
		if(err || !outlet) {
			redirect(null, null);
		}
		else {
			redirect(outlet, outlet.publicUrl[0])
		}
	})

	function redirect(outlet, url) {
		var city = getCityName(outlet);
		if(!url || !city) {
			res.send(200);
		}
		else {
			res.redirect(city + '/' + url);
		}
	}

	function getCityName (outlet) {
		if(!outlet || !outlet.contact || !outlet.contact.location.city) {
			return null;
		}
		var city_name = outlet.contact.location.city.toLowerCase();
		if(city_name === 'gurgaon'
			|| city_name === 'noida'
			|| city_name === 'delhi') {
			return 'ncr';
		}
		return city_name.toLowerCase();
	}
}