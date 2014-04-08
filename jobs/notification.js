var cron = require('cron');

var mongoose = require('mongoose');
mongoose.connect('mongodb://54.214.46.139/twyst');
var Schema = mongoose.Schema;
var notif = require('../models/notif');

var Notif = mongoose.model('Notif');

var cronJob = cron.job("5 * * * * *", function(){
    
    Notif.find({scheduled_at: {$gt: new Date(Date.now() - 300), $lt: new Date()}}, function (err, docs) {

    	if(err) {

    	}
    	else {
    		
    	}
    });
});

cronJob.start();