'use strict';
var mongoose = require('mongoose');
var Notif = mongoose.model('Notif');

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
		var notif = new Notif(obj);

		notif.save(function (err) {
			sendResponse(err);
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