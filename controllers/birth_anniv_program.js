var mongoose = require('mongoose');
var BirthAnnivProgram = mongoose.model('BirthAnnivProgram');
var _ = require('underscore');

module.exports.create = function (req, res){
	var birth_anniv_program = {};
	birth_anniv_program = _.extend(birth_anniv_program, req.body);
	birth_anniv_program = new BirthAnnivProgram(birth_anniv_program);
	birth_anniv_program.save(function (err, birth_anniv_program) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error saving birth/anniv programs',
				'info': err
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Saved Successfully',
				'info': birth_anniv_program
			});
		}
	});
};

module.exports.update = function(req,res) {	
	var updated_birth_anniv_program = {};
	updated_birth_anniv_program = _.extend(updated_birth_anniv_program, req.body);
	var id = updated_birth_anniv_program._id;
	delete updated_birth_anniv_program._id;
	BirthAnnivProgram.findOneAndUpdate({
		_id: id
	}, {
		$set: updated_birth_anniv_program
	}, {
		upsert: true
	}, function (err, updated_birth_anniv_program) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error updating birth/anniv program',
						'info': JSON.stringify(err)
			});
		}
		else {
			res.send(200, {	'status': 'success',
							'message': 'Updated birth/anniv program',
							'info': updated_birth_anniv_program
				});
		}
	});
};

module.exports.delete = function (req, res) {
	var birth_anniv_program_id;
	if(req.params.birth_anniv_program_id) {
		birth_anniv_program_id = req.params.birth_anniv_program_id;
		deleteBirthAnnivProgram(birth_anniv_program_id);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Incorrect request format',
			'info': ''
		});
	}
	
	function deleteBirthAnnivProgram (birth_anniv_program_id) {
		BirthAnnivProgram.findOneAndRemove({_id: birth_anniv_program_id}, function(err){
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error deleting birth/anniv program',
					'info': err
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully deleted birth/anniv program',
					'info': ''
				});
			};
		});
	}
};

module.exports.getBirthAnnivProgram = function(req, res){
	var birth_anniv_program_id;
	if(req.params.birth_anniv_program_id) {
		birth_anniv_program_id = req.params.birth_anniv_program_id;
		fetchBirthAnnivProgram(birth_anniv_program_id);
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Incorrect request format',
			'info': ''
		});
	}
	function fetchBirthAnnivProgram (birth_anniv_program_id) {
		BirthAnnivProgram.findOne({_id: birth_anniv_program_id}, function(err, birth_anniv_program){
			if (err) {
				res.send(400, {
					'status': 'error',
					'message': 'birth/anniv Program Not Found',
					'info': err
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got birth/anniv Program',
					'info': birth_anniv_program
				});
			};
		});
	}
}