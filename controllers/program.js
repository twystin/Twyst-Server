var mongoose = require('mongoose'),
	_ = require('underscore'),
	async = require('async'),
	TagCtrl = require('./tag'),
	VoucherCtrl = require('./voucher');
var Program = mongoose.model('Program'),
	Offer = mongoose.model('Offer'),
	Tier = mongoose.model('Tier'),
	Tag = mongoose.model('Tag');

var program = {};
var errs = [];
program.tiers = [];

module.exports.get = function (req, res) {

	Program.find(getQuery(), function (err, programs) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting programs',
				'info': err
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got programs',
				'info': programs
			});
		}
	})

	function getQuery() {
		var status = req.query.status;
		var q = {
			'accounts': req.user._id
		};
		if(!status || status === 'ALL') {
			q.status = {'$ne': 'draft'};
		}
		else {
			q.status = status;
		}
		return q;
	}
}


module.exports.getCount = function (req, res) {
	Program.count({'accounts': req.params.user_id}, function (err, count) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting count',
				'info': JSON.stringify(err)
			})
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got count',
				'info': count
			})
		}
	})
}

module.exports.onlyPrograms = function (req, res) {
	Program.find({accounts: req.params.user_id}, function (err, programs) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting programs',
				'info': JSON.stringify(err)
			})
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got count',
				'info': JSON.stringify(programs)
			})
		}
	})
};

module.exports.query = function (req, res) {
	Program.find({
		accounts: getAccountIdForProgram()
	})
	.populate('outlets')
	.exec(function (err, programs) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting programs',
				'info': err
			});
		}
		else {
			res.send(200, {
				'status': 'error',
				'message': 'Got programs successfully',
				'info': programs
			});
		}
	});

	function getAccountIdForProgram() {
		if(req.user.role === 4 || req.user.role === 5) {
			var user = req.user.toObject();
			return user.account;
		}
		return req.user._id;
	}
};

module.exports.readOne = function (req, res) {
	Program.findOne({_id: req.params.program_id})
	.populate('outlets')
	.exec(function (err, program) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting programs',
				'info': JSON.stringify(err)
			})
		}
		else {
			if(program) {
				program = program.toObject();
				populateTiers(program, function (err, populated_program) {
					var p = [];
					p.push(populated_program);
					if(err) {
						res.send(400, {
							'status': 'error',
							'message': 'Error populating tiers',
							'info': JSON.stringify(err)
						})
					}
					else {
						res.send(200, {
                            'status': 'success',
                            'message': 'Got all programs',
                            'info': p
                        });
					}
				})
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

function populateTiers(program, cb) {
	Tier.find({
		_id: {
			$in: program.tiers
		}
	})
	.populate('offers')
	.exec(function (err, tiers) {
		if(err) {
			cb(err, program);
		}
		else {
			program.tiers = tiers;
			cb(null, program);
		}
	})
}

module.exports.publicQuery = function (req, res) {
	Program.find({}, function (err, programs) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting programs',
				'info': JSON.stringify(err)
			})
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got programs',
				'info': JSON.stringify(programs)
			})
		}
	})
};

module.exports.create = function(req,res) {
	var errs = [];
	var program = {};
	program = _.extend(program, req.body);

	var number_of_tier = program.tiers.length;
	if(number_of_tier === 0) {
		saveProgram(program);
	}
	else {
		program.tiers.forEach(function (tier) {
			var offers = [];
			var number_of_offer = tier.offers.length;
			if(number_of_offer === 0) {
				number_of_tier--;
				if(number_of_tier === 0) {
					saveTiers(program);
				}
			}
			else {
				tier.offers.forEach(function (offer) {

					var offer = new Offer(offer);
					offer.save(function (err, offer) {
						number_of_offer--;
						if(err) {
							errs.push(err);
						}
						else {
							offers.push(offer._id);
						}
						if(number_of_offer === 0) {
							tier.offers = offers;
							number_of_tier--;
						}
						if(number_of_tier === 0) {
							saveTiers(program);
						}
					})
				})
			}
		});
	};

	function saveTiers(program) {
		var tiers = [];
		number_of_tier = program.tiers.length;

		program.tiers.forEach(function (tier) {
			var tier = new Tier(tier);

			tier.save(function (err, tier) {
				number_of_tier--;
				if(err) {
					errs.push(err);
				}
				else {
					tiers.push(tier._id);
				}
				if(number_of_tier === 0) {
					program.tiers = tiers;
					saveProgram(program);
				}
			})
		})
	};

	function saveProgram(program) {

		function isEmptyObject( obj ) {
			for ( var name in obj ) {
				return false;
			}
			return true;
		}

		if(!isEmptyObject(program.validity)) {
			if(!program.validity.burn_start) {
				program.validity.burn_start = program.validity.earn_start;
			}
			if(!program.validity.burn_end) {
				program.validity.burn_end = program.validity.earn_end;
			}
		}

		var program = new Program(program);

		program.save(function (err, program) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error saving programs',
					'info': JSON.stringify(err)
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Saved Successfully',
					'info': JSON.stringify(program)
				});
			}
		});
	};
};

module.exports.update = function(req,res) {
	var updated_program = {};
	updated_program = _.extend(updated_program, req.body);
	delete updated_program.__v;
	Program.findOne({_id: req.params.program_id}, function (err, program) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error saving program',
						'info': JSON.stringify(err)
			});
		} else {
			if(program) {
				program.name = updated_program.name;
				program.outlets = updated_program.outlets;
				program.status = updated_program.status;
				program.validity.earn_start = updated_program.validity.earn_start;
				program.validity.earn_end = updated_program.validity.earn_end;
				program.validity.burn_start = updated_program.validity.burn_start;
				program.validity.burn_end = updated_program.validity.burn_end;
				program.images = updated_program.images;
				program.save(function (err) {
					if(err) {
						res.send(400, {	'status': 'error',
									'message': 'Error saving program',
									'info': JSON.stringify(err)
						});
					}
					else {
						var validity = {
							start_date: program.validity.burn_start,
							end_date: program.validity.burn_end
						}
						VoucherCtrl.updateValidity(program._id, validity, function (err, num ) {
							if(err) {
								res.send(200, {
									'status': 'success',
									'message': 'Saved program, voucher update error',
									'info': err
								});
							}
							else {
								res.send(200, {
									'status': 'success',
									'message': 'Saved program, updated validity for vouchers',
									'info': num
								});
							}
						})

					};
				});
			}
			else {
				res.send(200, {	'status': 'success',
									'message': 'Saved program',
									'info': ''
				});
			};
		};
	});
};

// Pretty much modular code for delete Program
module.exports.delete = function (req, res) {
	var DeleteTierOfferCtrl = require('./batcher/deleteTierOffer')
	var program_id;
	if(req.params.program_id) {
		program_id = req.params.program_id;
		deleteProgram(program_id);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Incorrect request format',
			'info': ''
		});
	}

	function deleteProgram (program_id) {
		Program.findOneAndRemove({_id: program_id}, function(err, program){
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error deleting program',
					'info': JSON.stringify(errs)
				});
			}
			else {
				if(program.tiers) {
					if(program.tiers.length > 0) {
						DeleteTierOfferCtrl.delTierOffer(program.tiers);
					}
				}
				res.send(200, {
					'status': 'success',
					'message': 'Successfully deleted program',
					'info': ''
				});
			};
		});
	}
};


module.exports.getProgramByOffer = function (req, res) {
	Offer.findOne({_id: req.params.offer_id}, function (err, result) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting offer',
				'info': JSON.stringify(err)
			});
		}
		else {
			if(result === null) {
				res.send(200, {
					'status': 'error',
					'message': 'Error getting offer',
					'info': ''
				});
			}
			else {
				getTier(result);
			}
		}
	});

	function getTier(offer) {
		Tier.findOne({offers: offer._id}, function (err, tier) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting tier',
					'info': JSON.stringify(err)
				});
			}
			else {
				if(tier === null) {
					res.send(200, {
						'status': 'error',
						'message': 'Error getting tier',
						'info': ''
					});
				}
				else {
					getProgram(tier);
				}
			}
		});
	}

	function getProgram(tier) {
		Program.find({tiers: tier._id}, function (err, program) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting program',
					'info': ''
				});
			}
			else {
				if(program === null) {
					res.send(200, {
						'status': 'success',
						'message': 'Program not found',
						'info': ''
					});
				}
				else {
					read(program, res);
				}
			}
		});
	}
}
