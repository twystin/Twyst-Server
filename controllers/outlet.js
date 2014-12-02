var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');
var Checkin = mongoose.model('Checkin'),
	Reward = mongoose.model('Reward');
var _ = require('underscore');
var async = require('async');
var TagCtrl = require('../controllers/tag');
var CommonUtilities = require('../common/utilities');

module.exports.getSlugs = function (req, res) {
	Outlet.find({'outlet_meta.status': 'active'}, function (err, outlets) {
		if(err || !outlets) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		}
		else {
			var details = [];
			outlets.forEach(function (o) {
				var obj = {
					'_id': o._id,
					'name': o.basics.name,
					'location': o.contact.location.locality_1[0],
					'publicUrl': o.publicUrl,
					'shortUrl': o.shortUrl
				};
				details.push(obj);
			})
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got outlets',
				'info': CommonUtilities.shuffleArray(details)
			});
		}
	});
}

module.exports.get = function (req, res) {
	Outlet.find(getQuery(), function (err, outlets) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got outlets',
				'info': outlets
			});
		}
	})

	function getQuery() {
		var status = req.query.status;
		var q = {
			'outlet_meta.accounts': req.user._id
		};
		if(!status || status === 'ALL') {
			q['outlet_meta.status'] = {'$ne': 'draft'};
		}
		else {
			q['outlet_meta.status'] = status;
		}
		return q;
	}
}

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

	if(longitude && latitude) {
		getData();
	}
	else {
		res.send(400,{'status': 'error',
		  				'message': 'Error getting list of outlets',
		  				'info': ''
		});
	}
	//, $maxDistance: 0.01
	//Outlet.geoNear([Number(longitude), Number(latitude)], {num: 5,distanceMultiplier: 6371 }, function(err, outlets) {
	function getData() {
		Outlet.find({'outlet_meta.status': 'active','contact.location.coords': { $nearSphere: [longitude, latitude], $maxDistance: 5000}}, {}, {skip: 0}, function(err, outlets) {
			if (err) {
				console.log(err)
				res.send(400,{'status': 'error',
				  'message': 'Error getting list of outlets',
				  'info': JSON.stringify(err)
				});
			} else {
				getProgramForOutlets(outlets, res);   
			}
		});
	}
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
		Program.find({outlets: item._id, status: 'active'}, function (err, programs) {
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
	var publicUrl = req.params.publicUrl;
	publicUrl = publicUrl.toLowerCase();
	Outlet.findOne({publicUrl: publicUrl}, function (err, outlet) {
		if(err) {
			res.send(400,  {
		    	'status': 'success',
		    	'message': 'Error getting outlet.',
		    	'info': err
		    });
		}
		else {
			if(outlet) {
				getData(outlet._id);
			}
			else {
				res.send(400,  {
			    	'status': 'success',
			    	'message': 'Error getting outlet.',
			    	'info': err
			    });
			}
		}
	});
	
	function getData (outlet_id) {
		async.parallel({
		    OUTLET: function(callback) {
		    	getOutlet(outlet_id, callback);
		    },
		    REWARDS: function(callback) {
		    	getRewards(outlet_id, callback);
		    }
		}, function(err, results) {
			results.closed_now = CommonUtilities.isOpen(results.OUTLET.business_hours);
			results.opensAt = null;
			if(results.closed_now) {
				results.opensAt = CommonUtilities.opensAt(results.OUTLET.business_hours);
			}
		    res.send(200,  {
		    	'status': 'success',
		    	'message': 'Got details successfully.',
		    	'info': results
		    });
		});
	}

	function getOutlet (outlet_id, callback) {
		Outlet.findOne({_id: outlet_id}, function(err, outlet) {
			callback (null, outlet || {});
		}); 
	}

	function getRewards (outlet_id, callback) {
		Program.findOne({
			outlets: outlet_id,
			'status': 'active'
		}, function(err, program) {

			if(program) {
				populateProgram(program);
			}
			else {
				callback(null, null);
			}
		});

		function populateProgram (program) {
			var tiers = [];
			var count = program.tiers.length;

			program.tiers.forEach(function (id) {
				Tier.findOne({_id: id}).populate('offers').exec(function (err, tier) {
						var t = {};
						t = tier;
						count--;
						tiers.push(t);
						if(count === 0) {
							program = program.toObject();
							program.tiers = tiers;
							callback(null, getOffers(program));
						}
					})
			});
		}
	}

	function getOffers (p) {
	    var rewards = [];
	    var val = -1;

	    var program = p;
	    var obj = {};
	    
	    for(var i = 0; i < program.tiers.length; i++) {
	    	if(program.tiers[i]) {
	    		for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
		            
		            for(var j = 0; j < program.tiers[i].offers.length; j++) {
		                obj = {};
		                if(program.tiers[i].offers[j]) {
		                	if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
			                    if((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
			                        obj.count = lim + 1;
			                        obj.desc = CommonUtilities.rewardify(program.tiers[i].offers[j]);
			                        obj.title = program.tiers[i].offers[j].basics.description;
			                        obj.terms = program.tiers[i].offers[j].terms;
			                        rewards.push(obj);
			                    }
			                }
			                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
			                    
			                    if(lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
			                        obj.count = lim + 1;
			                        obj.desc = CommonUtilities.rewardify(program.tiers[i].offers[j]);
			                        obj.title = program.tiers[i].offers[j].basics.description;
			                        obj.terms = program.tiers[i].offers[j].terms;
			                        rewards.push(obj);
			                    }
			                }
			                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
			                    if(lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
			                        obj.count = lim + 1;
			                        obj.desc = CommonUtilities.rewardify(program.tiers[i].offers[j]);
			                        obj.title = program.tiers[i].offers[j].basics.description;
			                        obj.terms = program.tiers[i].offers[j].terms;
			                        rewards.push(obj);
			                    }
			                }
		                }
		            }
		        }	
	    	}
	        
	    }
	    
	    rewards = _.uniq(rewards, function (obj) {
	    	return obj.count;
	    });

	    rewards = _.sortBy(rewards, function (obj) {
	    	return obj.count;
	    });

	    return rewards;
	}
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
	created_outlet.publicUrl = getPublicUrl(created_outlet);
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

module.exports.getOutletsByAuth = function (req, res){

	Outlet.find({
		'outlet_meta.accounts': req.user._id
	}, function (err, outlets) {
		if(err || !outlets) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got outlets',
				'info': outlets
			});
		}
	});

}

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

module.exports.getFeatured = function(req, res){
	var num = req.query.num || 6;
	Outlet.find({
		'outlet_meta.status': 'active'
	})
	.select({
		'basics': 1,
		'contact.location': 1,
		'photos': 1,
		'shortUrl': 1
	})
	.exec(function (err, outlets) {
		if(err || !outlets) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		}
		else {
			outlets = CommonUtilities.shuffleArray(outlets);
			outlets = _.uniq(outlets, function(obj) {
				return obj.basics.name
			});
			outlets = outlets.slice(0, num)
			getRewards(outlets, function (results) {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got outlets',
					'info': results
				});
			})
		}
	});
}

module.exports.getDiscovered = function (req, res) {
	var start = req.query.start || 1,
		end = req.query.end || 10,
		q = req.query.q ? {
			'outlet_meta.status': 'active',
			$or:[{
					'basics.name': new RegExp(req.query.q, "i")
				}, 
				{
					'contact.location.locality_1': new RegExp(req.query.q, "i")
				},
				{
					'contact.location.locality_2': new RegExp(req.query.q, "i")
				},
				{ 
					'contact.location.city': new RegExp(req.query.q, "i")
				},
				{ 
					'attributes.tags': new RegExp(req.query.q, "i")
				}
			]
		} : {'outlet_meta.status': 'active'};

	async.parallel({
	    total: function(callback) {
	    	getOutletCount(q, callback);
	    },
	    results: function(callback) {
	    	getOutlets(q, start, end, callback);
	    }
	}, function(err, data) {
	    if(err) {
	    	res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
	    }
	    else if(!data || !data.results) {
	    	res.send(200, {
				'status': 'success',
				'message': 'Got no outlets',
				'info': []
			});
	    }
	    else {
	    	getRewards(data.results, function (results) {
	    		data.results = results;
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got outlets',
					'info': data
				});
			})
	    }
	});

	function getOutlets(q, start, end, callback) {
		Outlet.find(q)
		.select({
			'basics': 1,
			'contact.location': 1,
			'photos': 1,
			'shortUrl': 1
		})
		.skip(start - 1)
		.limit(end - start)
		.exec(function (err, outlets) {
			callback(err, outlets);
		});
	}

	function getOutletCount(q, callback) {
		Outlet.count(q, function (err, count) {
			callback(err, count);
		})
	}
}

function getRewards(outlets, cb) {
	var results = [];
	async.each(outlets, function (o, callback) {
		Reward.findOne({
			outlets: o._id,
			status: 'active'
		}, function (err, reward) {
			var result = {};
			if(err || !reward || !reward.rewards || !reward.rewards.length) {
				result.reward = null;
			}
			else {
				result.reward = reward.rewards[reward.rewards.length - 1];
			}
			result.outlet = o;
			results.push(result);
			callback();
		});
	}, function (err) {
		cb(results);
	})
}

module.exports.getDiscoveredNear = function (req, res) {
	var loc = {
			latitude: req.query.lat,
			longitude: req.query.lon,
		},
		dis = req.query.distance,
		q = req.query.q ? {
			'outlet_meta.status': 'active',
			$or:[{
					'basics.name': new RegExp(req.query.q, "i")
				}, 
				{
					'contact.location.locality_1': new RegExp(req.query.q, "i")
				},
				{
					'contact.location.locality_2': new RegExp(req.query.q, "i")
				},
				{
					'contact.location.city': new RegExp(req.query.q, "i")
				},
				{ 
					'attributes.tags': new RegExp(req.query.q, "i")
				}
			]
		} : {'outlet_meta.status': 'active'};

	getOutlets(q, function (err, outlets) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting outlets',
				'info': err
			});
		}
		else if(!outlets || !outlets.length) {
			res.send(200, {
				'status': 'success',
				'message': 'Got no outlets.',
				'info': []
			});
		}
		else {
			outlets = filterOutletsNear(outlets);
			getRewards(outlets, function (results) {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got outlets',
					'info': results
				});
			})
		}
	});

	function filterOutletsNear(outlets) {
		var results = [];
		outlets.forEach(function (o) {
			var distance = CommonUtilities.calculateDistance(o.contact.location.coords, loc);
			if(distance <= dis) {
				results.push(o);
			}
		});
		return results;
	}

	function getOutlets(q, callback) {
		Outlet.find(q)
		.select({
			'basics': 1,
			'contact.location': 1,
			'photos': 1,
			'shortUrl': 1
		})
		.exec(function (err, outlets) {
			callback(err, outlets);
		});
	}
}