var fs = require('fs');
var schedule = require('node-schedule');
var async = require('async');
var SmsSender = require('./smsSender');
var GcmBatcher = require('./gcmBatcher');
var notif = require('../models/notif');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Notif = mongoose.model('Notif');

mongoose.connect('mongodb://50.112.253.131/twyst');

var job = schedule.scheduleJob({minute: 38, dayOfWeek: [new schedule.Range(0,6)]}, smsNotifications);

function smsNotifications () {
    getNotifications(
		new Date(Date.now() - 30 * 60 * 1000), 
		new Date(Date.now() + 30 * 60 * 1000), 
		'DRAFT', 
		function (notifs) {
			if(notifs.length > 0) {
				notifs.forEach(function(item) {
					SmsSender.sendBulkSMS(item);
				    item.status = 'SENT';
				    item.sent_at = Date.now();
				    item.save();
				});
			}
			else {
			}
			console.log("Notifs sent at: " + new Date())
		}
    );
}

function getNotifications(end, status, callback) {
    Notif.find({
		message_type: "SMS",
		scheduled_at: {
		    $lte: end
		},
		status: status
	    }, function(err, notifs) {
		if (err) { 
		    console.log(err); 
		} else {
			console.log(notifs)
		    callback(notifs);
		}
    });
};
