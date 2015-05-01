var mongoose = require('mongoose');
var Favourite = mongoose.model('Favourite');
var _ = require('underscore');
var UserDataCtrl = require('./user/userDataCtrl');

module.exports.query = function(req,res) {
	Favourite.find({account: req.user._id}).populate('outlets').populate('program').populate('tier').populate('offers').exec(function(err,favourites) {
		if (err) {
			res.send({	'status': 'error',
						'message': 'Error getting list of Favourite',
						'info': JSON.stringify(err)
			});
		} else {
			res.send({	'status': 'success',
						'message': 'Got all Favourite',
						'info': JSON.stringify(favourites)
			});
		}
	});
};

module.exports.read = function(req,res) {
	Favourite.findOne({slug: req.params.favourite_id}, function(err,favourite) {
		if (err) {
			res.send({	'status': 'error',
						'message': 'Error getting Favourite id ' + req.params.favourite_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send({	'status': 'success',
						'message': 'Got Favourite ' + req.params.favourite_id,
						'info': JSON.stringify(favourite)
			});
		}
	}) 
};

module.exports.create = function(req,res) {
    var created_favourite = {}; //_.extend(created_favourite, req.body);

  	created_favourite = _.extend(created_favourite, req.body);
    var favouriteNew = new Favourite(created_favourite);

    Favourite.findOne({offers: created_favourite.offers,
    					outlets: created_favourite.outlets,
    					account: created_favourite.account}, 
    					function (err, favourite) {
    						if(err) {
    							res.send(200, {	'status': 'success',
											'message': 'Saved Favourite',
											'info': ''
								});
    						}
    						else {
    							if(favourite === null) {
    								createNew();	
    							}
    							else {
    								res.send(200, {	'status': 'success',
												'message': 'Saved Favourite',
												'info': ''
									});
    							}
    						}

    })

	function createNew () {
		delete favouriteNew.__v;
		favouriteNew.save(function(err) {
			if (err) {
				res.send(400, {	'status': 'error',
							'message': 'Error saving Favourite',
							'info': JSON.stringify(err)
				});
			} else {
				// Refresh cache
				UserDataCtrl.refreshData(req, function (status) {
					// Data refreshed
				});
				res.send(200, {	'status': 'success',
							'message': 'Saved Favourite',
							'info': ''
				});
			}				
		});
	}
};

module.exports.delete = function(req,res) {
	
	var outlet_id;
	var offer_id;

	if(req.user) {
		outlet_id = req.params.outlet_id;
		offer_id = req.params.offer_id;
		deleteFavourite();
	}
	else {
		res.send(400, {	'status': 'error',
					'message': 'Error deleting Favourite ',
					'info': JSON.stringify(err)
		});
	}

	function deleteFavourite () {
		Favourite.findOneAndRemove({account: req.user._id, outlets: outlet_id, offers: offer_id}, function(err){
			if (err) {
				res.send(400, {	'status': 'error',
							'message': 'Error deleting Favourite ',
							'info': JSON.stringify(err)
				});
			} else {
				// Refresh cache
				UserDataCtrl.refreshData(req, function (status) {
					// Data refreshed
				});
				res.send(200, {	'status': 'success',
							'message': 'Successfully deleted Favourite',
							'info': ''
				});
			}
		});
	}
};