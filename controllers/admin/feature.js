var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var async = require('async');

var CacheCtrl = require('../cacheCtrl.js');

module.exports.changeOutletFeatured = function (req, res) {
	if(!req.body.outlet_id) {
		res.send(400, {
	    	'status' : 'error',
            'message' : 'Request incomplete.',
            'info': ''
        });
	}
	else { 
		changeFeatured();
	}

	function changeFeatured() {
		Outlet.findOne({_id: req.body.outlet_id}, function (err, outlet) {
			if(err) {
				res.send(400, {
			    	'status' : 'error',
	                'message' : 'Error getting outlet.',
	                'info': err
	            });
			}
			else {
				if(!outlet) {
					res.send(400, {
				    	'status' : 'error',
		                'message' : 'Outlet not found.',
		                'info': ''
		            });
				}
				else {
					outlet.outlet_meta.featured = req.body.featured;
					outlet.save(function (err) {
						if(err) {
							res.send(400, {
						    	'status' : 'error',
				                'message' : 'Error getting outlet.',
				                'info': err
				            });
						}
						else {
							CacheCtrl.clear();
							res.send(200, {
						    	'status' : 'success',
				                'message' : 'successfully updated status.',
				                'info': ''
				            });
						}
					});
				}
			}
		})
	}
}