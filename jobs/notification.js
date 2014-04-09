var cron = require('cron');

var mongoose = require('mongoose');

var gcm = require('node-gcm');

var SERVER_KEY = 'AIzaSyCFqJe0ZkpnSdII3EZx7nQhMq8Om1Oul58';

mongoose.connect('mongodb://54.214.46.139/twyst');
var Schema = mongoose.Schema;
var notif = require('../models/notif');

var Notif = mongoose.model('Notif');
var Account = mongoose.model('Account');

var cronJob = cron.job("5 * * * * *", function(){
    
    (function findNotifications() {
    	Notif.find({
	    	scheduled_at: {
	    		$gt: new Date(Date.now() - 300), 
	    		$lt: new Date()
	    	},status: "DRAFT"}, function (err, docs) {

	    	if(err) {
	    		console.log("ERROR ERROR ERROR");
	    		console.log(err);
	    		console.log("ERROR ERROR ERROR");
	    	}
	    	else {
	    		if(docs.length > 0) {
	    			sendNotifications(docs);
	    		}
	    	}
	    });
    })();
});

function sendNotifications(docs) {

	docs.forEach(function (item) {
		getGCM(item);
	});
}

function getGCM(item) {

	Account.findOne({phone: item.phone, role: {$gt: 5}}, function (err, user) {
		if(err || (user === null)) {
			item.status = "ERROR";
			item.comment = "USER NOT FOUND";
			item.save();
		}
		else {
			if(user.gcm) {
				pushNotification(item, user.gcm);
			}
			else {
				item.status = "ERROR";
				item.comment = "GCM NOT FOUND FOR USER";
				item.save();
			}
		}
	});
}

function pushNotification(item, gcm) {
	var message = new gcm.Message();
	//API Server Key
	var sender = new gcm.Sender(SERVER_KEY);
	var registrationIds = [];

	// Value the payload data to send...
	message.addData('message', item.message.body);
	message.addData('title',item.message.head);
	message.addData('msgcnt','1'); // Shows up in the notification in the status bar
	message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
	//message.collapseKey = 'demo';
	//message.delayWhileIdle = true; //Default is false
	message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

	// At least one reg id required
	registrationIds.push(gcm);

	/**
	 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
	 */
	sender.send(message, registrationIds, 4, function (result) {
	    console.log(result);
	    // TODO: Saving the message status recieved.
	});
}

cronJob.start();