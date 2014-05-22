var gcm = require('node-gcm');
var csv = require('csv');
var fs = require('fs');

//API Server Key
var sender = new gcm.Sender('AIzaSyCracQVWEuEGaXI8REyDjcaemUAwdwgWy4');

csv()
.from.stream(fs.createReadStream(__dirname + '/notifications.csv', { encoding: 'utf8' }))
.on('record', function (row, index) {
    if (index > 0) {
        var gcm_id = row[0];
        var message = new gcm.Message();

		// Value the payload data to send...
		message.addData('message', row[1]);
		message.addData('title','Biryani Blues' );
		message.addData('msgcnt','1'); // Shows up in the notification in the status bar
		message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
		//message.collapseKey = 'demo';
		//message.delayWhileIdle = true; //Default is false
		message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

        sendPush(message, gcm_id);
		/**
		 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
		 */
    }
})
.on('end', function (count) {
    console.log("Message sent to all the users");
})
.on('error', function (error) {
    console.log(error.message);
});

function sendPush(message, id) {
	var registrationIds = [];
	registrationIds.push(id);
	sender.send(message, registrationIds, 4, function (result) {
	    console.log(result);
	});
}