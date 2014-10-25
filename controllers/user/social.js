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
		var social_graph = {};
		social_graph[key] = data;
		Account.findOneAndUpdate({
			_id: user._id
		}, {
			$set: social_graph
		}, {upsert: true}, function (err, user){
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