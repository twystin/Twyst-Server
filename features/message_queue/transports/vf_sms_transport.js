var http = require('http');
var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

// payload format: {phone, from, message}
module.exports.send = function(to, payload, success, error) {
  var send_sms_url =  sms_push_url +
                      payload.phone +
                      "&from=" +
                      payload.from +
                      "&udh=0&text=" +
                      payload.message;

  http.get(send_sms_url + payload, function(res){
    var body = '';
    res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
          success(body);
        });

        res.on('error', function(e) {
          error(e);
        });
  });
}
