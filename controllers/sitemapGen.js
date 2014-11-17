var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var fs = require('fs');

module.exports.initSitemap = function (req, res) {

	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	var formatedDate = yyyy + '-' + mm + '-' + dd;

	Outlet.find({
		'outlet_meta.status': 'active'
	}, function (err, outlets) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error generating sitemap.',
				'info': err
			});
		}
		else {
			var sitemap = generateSitemap(outlets);
			fs.writeFile('../Twyst-Web-Apps/sitemap.xml', sitemap, function (err, doc) {
				if(err) {
					res.send(400, {
						'status': 'error',
						'message': 'Error generating sitemap.',
						'info': err
					});
				}
				else {
					res.send(200, {
						'status': 'success',
						'message': 'Successfully generated sitemap.',
						'info': ''
					});
				}
			});
		}
	});

	function generateSitemap(outlets) {
		var sitemap = '';
		var changefreq = 'daily';
		sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
		sitemap += getUrlTag("http://twyst.in", changefreq, 1);
		outlets.forEach(function (o) {
			var outletUrl = 'http://twyst.in/' + getUrl(o);
			sitemap += getUrlTag(outletUrl, changefreq, 0.8, formatedDate);
		});
		sitemap += '\n</urlset>';

		return sitemap;
	}

	function getUrl(outlet) {
		return getCityName(outlet) + '/' + outlet.publicUrl[0];
	}

	function getCityName (outlet) {
		if(!outlet.contact && !outlet.contact.location.city) {
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

	function getUrlTag (url, changefreq, priority, formatedDate) {
		var data = '';
		data += '\n\t<url>';
		data += '\n\t\t<loc>';
		data += '\n\t\t\t' + url;
		data += '\n\t\t</loc>';
		if(formatedDate) {
			data += '\n\t\t<lastmod>' + formatedDate + '</lastmod>';
		}
		data += '\n\t\t<changefreq>' + changefreq + '</changefreq>';
		data += '\n\t\t<priority>' + priority + '</priority>';
		data += '\n\t</url>';
		return data;
	}
}