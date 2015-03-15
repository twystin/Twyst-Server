var gcm = require('node-gcm');
var fs = require('fs');

module.exports.sendPush = function(item) {
    //API Server Key
    var sender = new gcm.Sender(item.server_key);
    var message = new gcm.Message();
    message.addData('message', item.body);
    // Value the payload data to send...
    message.addData('title', item.head);
    message.addData('msgcnt', '1'); // Shows up in the notification in the status bar
    message.addData('soundname', 'beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
    //message.collapseKey = 'demo';
    //message.delayWhileIdle = true; //Default is false
    message.timeToLive = 10000; // Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

    var registrationIds = [];
    registrationIds = registrationIds.concat(item.gcms);

    console.log(message);
    sender.send(message, registrationIds, 4, function(result) {
        console.log(result);
    });
};
