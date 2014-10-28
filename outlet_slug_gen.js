var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('./config/config_models')();

var Outlet = mongoose.model('Outlet');
mongoose.connect('mongodb://50.112.253.131/twyst');

Outlet.find({}, function (err, outlets) {
	outlets.forEach(function (o) {
		var city = o.contact.location.city.toLowerCase();
		// if(city === 'delhi' 
		// 	|| city === 'gurgaon' 
		// 	|| city === 'noida' 
		// 	|| city === 'new delhi') {
		// 	var url = '/' + 'ncr' + '/' +
		// 		o.contact.location.locality_2[0] + '/' +
		// 		o.basics.name + ' ' + o.contact.location.locality_1[0] + ' ' +
		// 		o.contact.location.city;
		// }
		// else {
		// 	var url = '/' + o.contact.location.city + '/' + 
		// 		o.contact.location.locality_2[0] + '/'
		// 		o.basics.name + ' ' + o.contact.location.locality_1[0];
		// }
		var url = o.basics.name + ' ' + o.contact.location.locality_1[0] + ' ' +
				o.contact.location.city;
		url = url.replace(/'/g, '');
		url = url.replace(/& /g, '');
		url = url.replace(/- /g, '');
		url = url.replace(/\./g, '');
		url = url.replace(/!/g, '');
		url = url.replace(/ /g, '-');
		o.publicUrl = o.publicUrl || [];
		o.publicUrl.push(url.toLowerCase());
		console.log(url)
		o.save(function (err) {
			if(err) {
				console.log(err)
			}
		})
	})
})