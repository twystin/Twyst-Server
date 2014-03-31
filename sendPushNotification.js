var gcm = require('node-gcm');
var http = require('http');
var message = new gcm.Message();
// var cronJob = require('cron').CronJob;
//API Server Key
var sender = new gcm.Sender('AIzaSyCpQ30WVDfD3o1De_6Eu1bEd1ALjQbIFhg');
var registrationIds = [];
 
// Value the payload data to send...
message.addData('message',"Hello Sir! Hope you like the feature!");
message.addData('title','Push Notification Sample' );
message.addData('msgcnt','3'); // Shows up in the notification in the status bar
message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
//message.collapseKey = 'demo';
//message.delayWhileIdle = true; //Default is false
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
 
// At least one reg id required
registrationIds.push('APA91bEhJde_B6YShwyPeLvdbq_ZPCatLWKzfA5x-yPx2eWUGXrHgnDhNsLeXksdzBbzCdSBzW7RuDTSQWt5zVPuMNnJn4pAwQQ3f2P8mpVoY0f6iRhFBF2rQsGW3swwJGa5JPix-EIzaoG74QI5JjCRt9iTHcZRLA');
//ADD NEW registrationIDs here. VERY IMPORTANT!!!!! to run on your device. Push ID string into registrationIds array. 
/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
var object= {};
var str = "";
http.get('http://localhost:3000/api/v1/notif', function(res){
                        res.setEncoding('utf8');
                        res.on('data', function(chunk){
                            str += chunk; 
                        });
                        res.on('end',function(){
                        	object = JSON.parse(str);
                        	console.log(JSON.parse(str));	
                        })
                    });




// var job = new cronJob({
//   cronTime: '00 52-59 16 * * *',
//   onTick: function() {
//     // Runs every weekday (Monday through Friday)
//     // at 11:30:00 AM. It does not run on Saturday
//     // or Sunday.

//     sender.send(message, registrationIds, 4, function (err,result) {
// 		if(err)
// 		{
// 			console.log(err);
// 		}
// 		else
// 		{
// 			console.log(result);
// 		}
// 	});

//   },
//   start: true
// });
// job.start();
// console.log(job);