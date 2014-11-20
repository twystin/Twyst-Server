var mongoose = require('mongoose');
var Follow = mongoose.model('Favourite');

module.exports.follow = function (req, res) {
	if(!req.body.outlet) {
		res.send(400, {
			'status': 'error',
			'message' : 'Error in request',
			'info': null
		})
	}
	else {
		var follow = {
			account: req.user._id,
			outlets: req.body.outlet
		};
		follow.findOne(follow, function (err, f) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message' : 'Error saving follow',
					'info': err
				})
			}
			else {
				if(follow) {
					res.send(200, {
						'status': 'success',
						'message': 'Outlet already followed',
						'info': follow
					})
				}
				else {
					follow = new Follow(follow);
					follow.save(function (err, follow) {
						if(err) {
							res.send(400, {
								'status': 'error',
								'message' : 'Error saving follow',
								'info': err
							})
						}
						else {
							res.send(200, {
								'status': 'success',
								'message': 'Saved follow outlet',
								'info': follow
							})
						}
					})
				}
			}
		})
	}
}

module.exports.unfollow = function () {
	if(!req.body.outlet) {
		res.send(400, {
			'status': 'error',
			'message' : 'Error in request',
			'info': null
		})
	}
	else {
		var follow = {
			account: req.user._id,
			outlets: req.body.outlet
		};
		Follow.remove(follow, function (err) {
			if(err) {
				res.send(400, {
					'status': 'error',
					'message' : 'Error unfollowing outlet',
					'info': err
				})
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Unfollowed outlet',
					'info': null
				})
			}
		})
	}
}