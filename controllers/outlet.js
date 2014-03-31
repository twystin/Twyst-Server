var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');
var _ = require('underscore');
var TagCtrl = require('../controllers/tag');

module.exports.getCount = function (req, res) {
	Outlet.count({'outlet_meta.accounts': req.params.user_id}, function (err, count) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting count',
				'info': JSON.stringify(err)
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got count',
				'info': count
			});
		}
	})
}

module.exports.query = function(req,res) {
	Outlet.find({'outlet_meta.accounts': req.params.user_id}, function(err,outlets) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting list of outlets',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got all outlets',
						'info': JSON.stringify(outlets)
			});
		}
	}) 
};

module.exports.nearbyOutlets = function(req,res) {
	var latitude = Number(req.params.latitude);
	var longitude = Number(req.params.longitude);
	var radius =  6371.0008; // Earth radius
	//, $maxDistance: 0.01
	//Outlet.geoNear([Number(longitude), Number(latitude)], {num: 5,distanceMultiplier: 6371 }, function(err, outlets) {
	Outlet.find({'outlet_meta.status': 'active','contact.location.coords': { $nearSphere: [longitude, latitude], $maxDistance: 5000}}, {}, {skip: 0}, function(err, outlets) {
		if (err) {
			res.send(400,{'status': 'error',
			  'message': 'Error getting list of outlets',
			  'info': JSON.stringify(err)
			});
		} else {
			getProgramForOutlets(outlets, res);   
		}
	 })
};

function getProgramForOutlets(outlets, res) {
	var num_outlets = outlets.length;
	var near_outlets = [];
	var errs = [];
	var outlet = {};

	if (num_outlets <= 0) {
		res.send(200,{'status': 'success',
			  'message': 'No outlets',
			  'info': JSON.stringify(outlets)
		});
	}
	else {
		outlets.forEach(function (item) {
			
			findProgram(item);
		});
	};

	function findProgram(item) {
		Program.find({outlets: item._id}, function (err, programs) {
			if(err){
				errs.push(err);
				outlet.outlet = item;
				outlet.programs = [];
				near_outlets.push(outlet);
				outlet = {};
				num_outlets--;
				if(num_outlets === 0) {
					responder(near_outlets);
				}
			}
			else {
				if(!programs.length){
					outlet.outlet = item;
					outlet.programs = [];
					near_outlets.push(outlet);
					outlet = {};
					num_outlets--;
					if(num_outlets === 0) {
						responder(near_outlets);
					}
				}
				else {
					read(programs, item);
				}
			}
		})
	}


	function read(programs, item) {

		var tiers = [];
		var recommended_programs = [];
		var num_programs = programs.length;
		programs.forEach(function (program) {
			Program.findOne({_id: program.id}).populate('tiers').exec(function (err, dummy_program) {
				if(err) {
					errs.push(err);
				}
				else {
					var num_tiers = dummy_program.tiers.length;
					dummy_program.tiers.forEach(function (tier) {
						Tier.findOne({_id: tier.id}).populate('offers').exec(function (err, tier) {
							num_tiers--;
							if(err) {
								errs.push(err);
							}
							else {
								tiers.push(tier);
								if(num_tiers === 0) {
									dummy_program.tiers = tiers;
									recommended_programs.push(dummy_program);
									num_programs--;
									tiers = [];
									if(num_programs === 0) {
										outlet.outlet = item;
										outlet.programs = recommended_programs;
										near_outlets.push(outlet);
										outlet = {};
										num_outlets--;
										if(num_outlets === 0) {
											responder(near_outlets);
										}
									}
								}
							}
						})
					})
				}
			})
		})
	}

	function responder(near_outlets) {
		res.send(200, {	'status': 'success',
						'message': 'Got all outlets',
						'info': JSON.stringify(near_outlets)
		});
	}

}

module.exports.consoleQuery = function(req,res) {

	Outlet.find({}, function(err,outlets) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting list of outlets',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got all outlets',
						'info': JSON.stringify(outlets)
			});
		}
	}) 
};

module.exports.read = function(req,res) {
	Outlet.find({_id: req.params.outlet_id}).populate('outlet_meta.offers').exec(function(err,outlet) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting outlet id ' + req.params.outlet_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got outlet ' + req.params.outlet_id,
						'info': JSON.stringify(outlet)
			});
		}
	}) 
};

module.exports.publicview = function(req,res) {
	Outlet.findOne({_id: req.params.outlet_id}).populate('outlet_meta.offers').exec(function(err,outlet) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting outlet id ' + req.params.outlet_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got outlet ' + req.params.outlet_id,
						'info': JSON.stringify(outlet)
			});
		}
	}) 
};

module.exports.all = function(req,res) {
	Outlet.find({'outlet_meta.status': 'active'}).populate('outlet_meta.offers').exec(function(err,outlets) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting outlets ',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got outlets ',
						'info': JSON.stringify(outlets)
			});
		}
	}) 
};

module.exports.create = function(req,res) {
	var created_outlet = {};
	created_outlet = _.extend(created_outlet, req.body);
	var outlet = new Outlet(created_outlet);
	outlet.save(function(err) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Outlet creation error. Please fill all required fields',
						'info': JSON.stringify(err)
			});
		} else {
			if(outlet.attributes.tags) {
				TagCtrl.create(outlet.attributes.tags, outlet._id);
			}
			res.send(200, {	'status': 'success',
						'message': 'Saved outlet',
						'info': ''
			});
		}				
	})
};

module.exports.update = function(req,res) {
	var updated_outlet = {};
	updated_outlet = _.extend(updated_outlet, req.body);
	to_be_updated = updated_outlet._id;
	delete updated_outlet._id;
	updated_outlet.basics.modified_at = Date.now();
	Outlet.findOneAndUpdate(
							{_id: to_be_updated}, 
							{$set: updated_outlet }, 
							{upsert:true},
							function(err,outlet) {
								if (err) {
									console.log(err);
									res.send(400, {	'status': 'error',
												'message': 'Update has failed. ',
												'info': JSON.stringify(err)
									});
								} else {
									if(outlet.attributes.tags) {
										TagCtrl.create(outlet.attributes.tags, outlet._id);
									}
									res.send(200, {	'status': 'success',
												'message': 'Successfully updated the outlet '+ updated_outlet.basics.name,
												'info': JSON.stringify(outlet)
									});
								}
							});
};

module.exports.delete = function(req,res) {

    Outlet.findOneAndRemove({'basics.name':req.params.outlet_id}, function(err){
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error deleting outlet ' + req.params.outlet_id,
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Successfully deleted outlet',
						'info': ''
			});
		}
	});
};

module.exports.archived = function(req,res) {
	var updated_outlet = {};
	updated_outlet.outlet_meta = {};
	updated_outlet = _.extend(updated_outlet, req.body);
	delete updated_outlet._id;
	updated_outlet.outlet_meta.status = 'archived';
	Outlet.findOneAndUpdate(
							{'basics.name': req.params.outlet_id}, 
							{$set: updated_outlet }, 
							{upsert:true},
							function(err,outlet) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating outlet ' + req.params.outlet_id,
												'info': JSON.stringify(err)
									});
								} else {
									res.send(200, {	'status': 'success',
												'message': 'Successfully updated outlet',
												'info': JSON.stringify(outlet)
									});
								}
							});
};

module.exports.getOffersForOutlet = function (req, res) {
	Program.find({outlets: req.params.outlet_id}, function (err, programs) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting programs',
				'info': JSON.stringify(err)
			})
		}
		else {
			if(programs.length > 0) {
				read(programs,res);
			}
			else {
				res.send(200, {
					'status': 'error',
					'message': 'Unable to get',
					'info': ""
				})
			}
		}
	})
};


//module.exports.read = function (req, res) {
function read(programs, res) {

	var errs = [];
	var tiers = [];
	var recommended_programs = [];
	var num_programs = programs.length;
	programs.forEach(function (program) {
		Program.findOne({_id: program.id}).populate('outlets').populate('tiers').exec(function (err, dummy_program) {
			if(err) {
				errs.push(err);
			}
			else {
				var num_tiers = dummy_program.tiers.length;
				if(num_tiers === 0) {
					dummy_program.tiers = tiers;
					recommended_programs.push(dummy_program);
					dummy_program = {};
					num_programs--;
					if(num_programs === 0) {
						res.send(200, {
                            'status': 'success',
                            'message': 'Got all programs',
                            'info': recommended_programs
                        });
					}
				}
				else {
					dummy_program.tiers.forEach(function (item) {
					Tier.findOne({_id: item._id}).populate('offers').exec(function (err, tier) {
						num_tiers--;
						if(err) {
							errs.push(err);
						}
						else {
							tiers.push(tier);
							tier = {};
							if(num_tiers === 0) {
								dummy_program.tiers = tiers;
								recommended_programs.push(dummy_program);
								dummy_program = {};
								num_programs--;
								tiers = [];
								if(num_programs === 0) {
									res.send(200, {
                                        'status': 'success',
                                        'message': 'Got all programs',
                                        'info': recommended_programs
                                    });
								}
							}
						}
					})
				})
				}
			}
		})
	})
};
