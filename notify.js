var gcm = require('node-gcm');
var message = new gcm.Message();

//API Server Key
var sender = new gcm.Sender('AIzaSyCracQVWEuEGaXI8REyDjcaemUAwdwgWy4');
var registrationIds = [];

// Value the payload data to send...
message.addData('message',"Expire 23 May. Redeem Now!");
message.addData('title','Biryani Blues Vouchers' );
message.addData('msgcnt','1'); // Shows up in the notification in the status bar
message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
//message.collapseKey = 'demo';
//message.delayWhileIdle = true; //Default is false
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

// At least one reg id required
//registrationIds.push('APA91bGyCNVUaN2O_nficPE4mbEjs-2l5aPf_JxTQt5ccN0Iw8uZXQep1DzpTn3R9kcYJ6ZgimCwaJTctzlTsFO8MUIEBWytAX-kmHlHjPKQNLurZA8k-Zc-90V_RcmwxV5fzJ-x2ecGFRT8thI46iQBny2J4NXJ8gsLTD7wa6qHh0lAh3d-fxc');
registrationIds.push('APA91bElsQpRP-SmaKex3ob6rmHTBf46ea0Mh_7t66ZpzTVSYeisGYu_RBen1k7MlFp5FoSfLLYytfButJyG2wHqMLk_4vNCV1AvNm_1YX49ZVmBGLIuMSNOGwrTZAHjbrjOQWSUCYi1Zo-8UQYUzDUuIUiEMROUbxTI5si7noZ7j8KJOEMEVjU');
//registrationIds.push('APA91bF4aL-UL3rQGB_HoCrtgCeqwn_BI5wsq0CyejZSG4tkRvopbeBOdrcyJ1llP0WqfWLIyhz8ITNqJ55ef-gU-0YYekjKlzqqELkWWKym7A-iPZXxJqy68sygEG-AuxxmJsB4mmVO07wFKk_zNxUFEgOXA1QPBQbKOOigFrUu_h2LCOvJMeI');
/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (result) {
    console.log(result);
});