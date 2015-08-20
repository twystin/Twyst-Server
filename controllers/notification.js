'use strict';
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('underscore');
var Notif = mongoose.model('Notif');
var Account = mongoose.model('Account');
var Unsbs = mongoose.model('Unsbs');

module.exports.get = function (req, res) {
	Notif.find({
		'status': 'DRAFT'
	})
	.sort({'logged_at': -1})
	.limit(100)
	.exec(function (err, notifs) {
		if(err) {
			res.send(400, {
				'status' : 'error',
	            'message' : 'Error getting notifs',
	            'info':  err
	        });
		}
		else {
			res.send(200, {
				'status' : 'success',
	            'message' : 'successfully got notifs',
	            'info':  notifs
	        });
		}
	})
}

module.exports.save = function (req, res) {

	var obj = req.body.obj;
	if((!req.body.phones) && (!obj.gcms)) {
		fillAllFields();
	}
	else if(req.body.phones) {
		if(obj.body 
			&& obj.head
			&& obj.scheduled_at) {
			obj.phones = req.body.phones;
			saveNotifs();
		}
		else {
			fillAllFields();
		}
	}
	else if(obj.gcms) {
		if(obj.body 
			&& obj.head
			&& obj.server_key
			&& obj.scheduled_at) {
			saveNotifs();
		}
		else {
			fillAllFields();
		}
	}

	function saveNotifs () {
		Account.find({
			phone: {
				$in: obj.phones
			},
			blacklisted: true
		}, {
			'phone': 1
		}, function(err, blacklistedUsers) {
			if(err) {
				return sendResponse(err);
			}

			obj.phones = _.difference(obj.phones, _.map(blacklistedUsers, function(user) {
				return user.phone;
			}));
			
			try {
				obj.outlet = ObjectId(obj.outlet);
				Unsbs.find({
					phone: {
						$in: obj.phones
					},
					'sms.outlets': {
						$in: [obj.outlet]
					}
				}, {
					'phone': 1
				}, function(err, unsubs) {
					if(err) {
						return sendResponse(err)
					}

					var unsubPhones = _.map(unsubs, function(unsub) {
						return unsub.phone;
					});
					obj.phones = _.difference(obj.phones, unsubPhones);
					var notif = new Notif(obj);

					notif.save(function (err) {
						sendResponse(err);
					});
				});

			} catch(err) {
				return sendResponse(new Error('Outlet ID is invalid'));
			}

			
		});
		
	}

	function fillAllFields () {
		res.send(400, {
			'status' : 'error',
            'message' : 'Fill all fields please.',
            'info':  ''
        });
	}

	function sendResponse(err) {

		if(err) {
			res.send(200, {
				'status' : 'success',
	            'message' : 'Notifications saved successfully.',
	            'info':  ''
	        });
		}
		else {
			res.send(200, {
				'status' : 'success',
	            'message' : 'Notifications saved successfully',
	            'info':  ''
	        });
		}
	}
}