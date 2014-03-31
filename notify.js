var gcm = require('node-gcm');
var message = new gcm.Message();

//API Server Key
var sender = new gcm.Sender('AIzaSyCFqJe0ZkpnSdII3EZx7nQhMq8Om1Oul58');
var registrationIds = [];

// Value the payload data to send...
message.addData('message',"Thank you for installing Twyst!!");
message.addData('title','Welcome to Twyst' );
message.addData('msgcnt','1'); // Shows up in the notification in the status bar
message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
//message.collapseKey = 'demo';
//message.delayWhileIdle = true; //Default is false
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

// At least one reg id required
registrationIds.push('APA91bEjaXcQOkH96670JP-nN3SpYMyU2AF-548QiyJWFf9c6rUYh_bk7euOqVdgC2emBybE_N6mhLx94gMv8SkoV66kpiSBHDP8gADafiRUjZe0vUi4ZxAvIA4M8dIXcBL7_OuN8UgJ2ykk7QWl1IZGu6ZYtXTnmQ');

/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (result) {
    console.log(result);
});