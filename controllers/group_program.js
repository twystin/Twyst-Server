var mongoose = require('mongoose');
var Program = mongoose.model('Program');
var GroupProgram = mongoose.model('GroupProgram');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var Tag = mongoose.model('Tag');
var _ = require('underscore');
var async = require('async');
var TagCtrl = require('../controllers/tag');
var Outlet = mongoose.model('Outlet');

module.exports.get = function (req, res) {
	
	getQuery(function (outlets) {
		GroupProgram.find({
			outlets: {
				$in: outlets.map(function (o) {
					return o._id;
				})
			}
		}, function (err, group_programs) {
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
					'info': group_programs
				});
			}
		})
	})

	function getQuery(cb) {

		Outlet.find({
			'outlet_meta.accounts':  req.user._id
		}).select({'_id': 1}).exec(function (err, outlets){
			cb(outlets || []);
		})
	}
}

module.exports.create = function (req, res){
	var group_program = {};
	group_program = _.extend(group_program, req.body);
	group_program = new GroupProgram(group_program);
		group_program.save(function (err, group_program) {
			if(err) {
				console.log(err);
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
					'info': JSON.stringify(group_program)
				});
			}
		});
};

module.exports.update = function(req,res) {	
	var updated_group_program = {};
	updated_group_program = _.extend(updated_group_program, req.body);
	GroupProgram.findOne({_id: req.body._id}, function (err, group_program) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error updating group program',
						'info': JSON.stringify(err)
			});
		} else {
			if(group_program !== null) {
				group_program.name = updated_group_program.name;
				group_program.outlets = updated_group_program.outlets;
				group_program.count_discount = updated_group_program.count_discount;
				group_program.description = updated_group_program.description;
				group_program.image = updated_group_program.image;			
				group_program.modified_date = updated_group_program.modified_date;
				group_program.save(function (err) {
					if(err) {
						res.send(400, {	'status': 'error',
									'message': 'Error updating group program',
									'info': JSON.stringify(err)
						});
						console.log(err);
					}
					else {
						res.send(200, {	'status': 'success',
									'message': 'Updated group program',
									'info': group_program
						});
					};
				});
			}
			else {
				res.send(200, {	'status': 'success',
									'message': 'Updated group program',
									'info': group_program
				});
			};
		};
	});
};

module.exports.delete = function (req, res) {
	var group_program_id;
	if(req.params.group_program_id) {
		group_program_id = req.params.group_program_id;
		deleteGroupProgram(group_program_id);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Incorrect request format',
			'info': ''
		});
	}
	
	function deleteGroupProgram (group_program_id) {
		GroupProgram.findOneAndRemove({_id: group_program_id}, function(err, group_program){
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error deleting program',
					'info': JSON.stringify(err)
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully deleted program',
					'info': ''
				});
			};
		});
	}
};

module.exports.getGroupProgram = function(req, res){
	var group_program_id;
	if(req.params.group_program_id) {
		group_program_id = req.params.group_program_id;
		fetchGroupProgram(group_program_id);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Incorrect request format',
			'info': ''
		});
	}
	function fetchGroupProgram (group_program_id) {
		GroupProgram.findOne({_id: group_program_id}, function(err, group_program){
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Group Program Not Found',
					'info': JSON.stringify(err)
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got Group Program',
					'info': group_program
				});
			};
		});
	}
}