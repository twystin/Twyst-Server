var gcm = require('node-gcm');
var http = require('http');
var message = new gcm.Message();
// var cronJob = require('cron').CronJob;
//API Server Key
var sender = new gcm.Sender('AIzaSyCq9tr4TE6herLEzYvMvnlYaXGw17o8-Fg');
var registrationIds = [];
 
// Value the payload data to send...
message.addData('message',"Hello Sir! Testing this.\n Is it a new line?");
message.addData('title','Push Notification Sample' );
message.addData('msgcnt','3'); // Shows up in the notification in the status bar
message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
//message.collapseKey = 'demo';
//message.delayWhileIdle = true; //Default is false
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
 
// At least one reg id required
registrationIds.push('APA91bFVY6XGZD_LzqcLea5Mp-xJCdwfJdtd1JNgJusIKqA6ukK4W0hlrglqLzbHichu4HzyC4c0i62IZim_BuQjXzVFHQ28_2CV9ibSm6VHgQb7axPcR6GtvHuN9w2hQOqn-NM04-eUEdqSiJxHcahmWZchr6Xrvw');
//ADD NEW registrationIDs here. VERY IMPORTANT!!!!! to run on your device. Push ID string into registrationIds array. 
/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
// var object= {};
// var str = "";
// http.get('http://localhost:3000/api/v1/notif', function(res){
//                         res.setEncoding('utf8');
//                         res.on('data', function(chunk){
//                             str += chunk; 
//                         });
//                         res.on('end',function(){
//                         	object = JSON.parse(str);
//                         	console.log(JSON.parse(str));	
//                         })
//                     });




// var job = new cronJob({
//   cronTime: '00 52-59 16 * * *',
//   onTick: function() {
//     // Runs every weekday (Monday through Friday)
//     // at 11:30:00 AM. It does not run on Saturday
//     // or Sunday.

    sender.send(message, registrationIds, 4, function (err,result) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			console.log(result);
		}
	});

//   },
//   start: true
// });
// job.start();
// console.log(job);