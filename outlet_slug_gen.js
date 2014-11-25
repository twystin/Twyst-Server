var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('./config/config_models')();

var Outlet = mongoose.model('Outlet');
mongoose.connect('mongodb://50.112.253.131/twyst');

Outlet.find({}, function (err, outlets) {
	outlets.forEach(function (o) {
		o.publicUrl = getPublicUrl(o);
		console.log(o.publicUrl)
		o.save(function (err) {
			if(err) {
				console.log(err)
			}
		})
	})
});

function getPublicUrl(o) {
	var publicUrl = [];
	if(!o.contact
		|| !o.contact.location
		|| !o.contact.location.city
		|| !(o.contact.location.locality_1 
				&& o.contact.location.locality_1.length)
		|| !(o.contact.location.locality_1 
				&& o.contact.location.locality_1.length)) {
		return publicUrl;
	}
	var url = o.basics.name 
		+ ' ' 
		+ o.contact.location.locality_1
		+ ' ' 
		+ o.contact.location.city;

	url = url.replace(/[^a-zA-Z0-9 ]/g, "");
	url = url.replace(/\s{1,}/g, '-');
	url = url.toLowerCase();
	publicUrl.push(url);
	return publicUrl;
}