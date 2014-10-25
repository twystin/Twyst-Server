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
	if(!req.params.shortUrl) {
		redirect(null);
	}
	Outlet.findOne({shortUrl: req.params.shortUrl.toUpperCase()}, function (err, outlet) {
		if(err || !outlet) {
			redirect(null);
		}
		else {
			redirect(outlet);
		}
	})

	function redirect(outlet) {
		if(!outlet) {
			res.redirect('/');
		}
		else {
			res.send(renderPage(outlet));
		}
	}

	function renderPage (outlet) {
		var html = '';
		html += '\n<!doctype html>';
		html += '\n<html ng-app="outletApp">';
		html += '\n\t<head>';
		html += '\n\t<title>'+ outlet.basics.name + ', ' + 
			outlet.contact.location.locality_1.toString() + ', ' + 
			outlet.contact.location.locality_2.toString() + ', ' +
			outlet.contact.location.city + ' - Twyst</title>';
		html += '<meta property="og:site_name" content="Twyst Outlet"/>';
		html += '<meta property="og:title" content="'+outlet.basics.name+', ' + outlet.contact.location.locality_1[0]+', Twyst" />';
		html +=	'<meta property="og:url" content="http://staging.twyst.in/outlets/#/'+outlet.publicUrl[0]+'" />';
		html +=	'<meta property="og:description" content="Unlock exclusive rewards for being a regular! Check in on Twyst every time you visit us or order." />';
		html += '<meta property="og:image" content="https://s3-us-west-2.amazonaws.com/twystmerchantpages/merchants/'+outlet.basics.slug+'/logo.png" />';
		html += '<script>window.location.href = "http://staging.twyst.in/'+ outlet.publicUrl[0] +'"</script>';
		html += '\n\t</head>';
		html += '\n\t<body>';
		html += '\n\t</body>'
		html += '</html>'
		res.send(html);
	}
}