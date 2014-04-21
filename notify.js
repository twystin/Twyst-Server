var gcm = require('node-gcm');
var message = new gcm.Message();

//API Server Key
var sender = new gcm.Sender('AIzaSyD8_Oai6yq0CfM9Vri7lI0pI0bhGi87B3g');
var registrationIds = [];

// Value the payload data to send...
message.addData('message',"Enjoyed your meal at Canton Spice Company? Remember - there's a portion of free Spring Rolls waiting for you on your 3rd check-in!");
message.addData('title','Welcome to Twyst' );
message.addData('msgcnt','1'); // Shows up in the notification in the status bar
message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
//message.collapseKey = 'demo';
//message.delayWhileIdle = true; //Default is false
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

// At least one reg id required
registrationIds.push('APA91bEz4ImNIKLiSfr36h9DT0MRjAq5ZYPRsQYB_G_gBNZMnnL-FQ6B84zJHpmhkqArpGkYQ8BJWf_E6D6VfnLXrn2YkVYiT5J6mTQLwICVc40A0AZlEduveeSuqHeY7HtCY3ZSOzWEUZrx-u9fW7glTzFxcwf3Pw');
registrationIds.push('APA91bEeqhlmrVnX_tLt3s81CEZYQGlyF5shxYO-GUn10ZyFasdtRyf_vNc1Gtq-MLOxhFm2ewZWMl63aNp9j_0AzB-NdAbjqoWyU3aE2ZY7DZVOu6mQLaqhTzPRuO32csH5RX-b_xR3-nAJPxiM3g2CuhNyZzCIWcXSNPWfdneKuUNpWnCMecQ');
registrationIds.push('APA91bHN6KYADMIE8bBATNe_88jVykeFLQBCrBp-bNpVeUvTUw74lTjR7Xg8C225MCzmcyfo17GRyXgirRKovSnyIA8GdrZEHJdDQcb7bMf4BV1csAgD2byt-IJlVhv228cE4MU2xHC7XhbDDv8yVR--g-d66E-dZw');
registrationIds.push('APA91bFnjPEGsrN1QvsRVLDmBFZD1FEaQzPg-VKYjqcc24N0HYDnihN-b3UQEDnKWAyo5-IF338gsBM3VsNUI0iwVDj8kHls85iKRZUUUomHCMkiJq4eXVlVorBQkAvC1BQ8-PjcyB42Z-r9FG6oVE-rIyllcWsEcRJsE2KsZMuqxzCNEBWtyDc');
registrationIds.push('APA91bFHibjYP2D6qyxPliMJF117b_KMcXb8KXPBrHc-tQWIxLLXspsz1ZORP8B90ws_iIrLjlhcoPs1DHosOH69UucQv4H_NLvCMeNcL_wU37TzYPcKlrUYUz72kbBacWBUpAmRuosSlpCPlMRuHxaTsmzgnUNiEw');

/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (result) {
    console.log(result);
});