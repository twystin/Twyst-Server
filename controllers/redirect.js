var mongoose = require('mongoose');
var Redirect = mongoose.model('Redirect');
var Outlet = mongoose.model('Outlet');
var _ = require('underscore');
var url = require('url');

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
	Outlet.findOne({shortUrl: req.params.shortUrl}, function (err, outlet) {
		if(err || !outlet) {
			redirect(null);
		}
		else {
			console.log(outlet)
			redirect(outlet.publicUrl[0])
		}
	})

	function redirect(url) {
		if(!url) {
			res.redirect('/');
		}
		else {
			res.redirect('/outlets/#/' + url);
		}
	}
}