'use strict';
var mongoose = require('mongoose');
var Notif = mongoose.model('Notif');

module.exports.save = function (req, res) {

	var obj = req.body.obj;
	var length;

	if((obj.phones.length > 0) 
		&& obj.message.head 
		&& obj.message.body
		&& obj.scheduled_at) {

		length = obj.phones.length;
		breakNotif();
	}
	else {
		res.send(400, {
			'status' : 'error',
            'message' : 'Please fill all required fields.',
            'info':  ''
        });
	};

	function breakNotif() {
		
		obj.phones.forEach( function (num) {
			var notif = {};
			notif.phone = num;
			notif.message = obj.message;
			notif.scheduled_at = obj.scheduled_at;
			
			notif = new Notif(notif);
			saveNotif(notif);
		});
	}

	var errs = [];

	function saveNotif(obj) {

		obj.save(function(err) {
			if(err) {
				errs.push(obj.phone);
				length--;			
			}
			else {
				length--;	
			}
			if(length === 0) {
				sendResponse();
			}
		});
	}

	function sendResponse() {

		if(errs.length === 0) {
			res.send(200, {
				'status' : 'success',
	            'message' : 'Notifications saved successfully.',
	            'info':  ''
	        });
		}
		else {
			res.send(200, {
				'status' : 'success',
	            'message' : 'Notifications saved successfully. Except these numbers. ' + errs,
	            'info':  ''
	        });
		}
	}
}