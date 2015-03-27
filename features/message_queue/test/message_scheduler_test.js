var ms = require('../message_scheduler.js');

var message = ms.create_ses("ar@twyst.in", "Hi there", "Hello from Twyst", "ar@twyst.in");

ms.send(message, function(data) {
  console.log("SUCESS")
  console.log(data)
}, function(err) {
  console.log("ERROR")
  console.log(err);
});
