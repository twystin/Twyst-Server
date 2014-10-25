var mongoose = require("mongoose");
var Account = mongoose.model('Account');

module.exports.update = function (req, res) {
	var user = req.user,
		key = req.body.key,
		data = req.body.data;
	if(user && key && data) {
		updateUser();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Request has no information.',
			'info': null
		});
	}

	function updateUser() {
		Account.findOne({
			_id: user._id
		}, function (err, user) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting user.',
					'info': null
				});
			}
			else {
				if(!user) {
					res.send(400, {
						'status': 'error',
						'message': 'User not registered.',
						'info': null
					});
				}
				else {
					user.social_graph = user.social_graph || {};
					user.social_graph[key] = data;
					user.save(function (err) {
						if(err) {
							res.send(400, {
								'status': 'error',
								'message': 'Error updating user.',
								'info': null
							});
						}
						else {
							res.send(200, {
								'status': 'success',
								'message': 'Successfully updated user.',
								'info': user
							});
						}
					})
				}
			}
		})
	}
}