var mongoose = require('mongoose');
var GroupProgram = mongoose.model('GroupProgram');
var _ = require('underscore');

module.exports.create = function (req, res){
	var group_program = {};
	group_program = _.extend(group_program, req.body);
	group_program = new GroupProgram(group_program);
	group_program.save(function (err, group_program) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error saving group programs',
				'info': err
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Saved Successfully',
				'info': group_program
			});
		}
	});
};

module.exports.update = function(req,res) {	
	var updated_group_program = {};
	updated_group_program = _.extend(updated_group_program, req.body);
	var id = updated_group_program._id;
	delete updated_group_program._id;
	GroupProgram.findOneAndUpdate({
		_id: id
	}, {
		$set: updated_group_program
	}, {
		upsert: true
	}, function (err, updated_group_program) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error updating group program',
						'info': JSON.stringify(err)
			});
		}
		else {
			res.send(200, {	'status': 'success',
							'message': 'Updated group program',
							'info': updated_group_program
				});
		}
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
		GroupProgram.findOneAndRemove({_id: group_program_id}, function(err){
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error deleting group program',
					'info': err
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully deleted group program',
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
					'info': err
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