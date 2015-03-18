// module.exports.send = function(to, payload, success, error) {
//   console.log("TO: " + to);
//   console.log("PAYLOAD: " + JSON.stringify(payload));
//   success("done");
// }

// load aws sdk
var aws = require('aws-sdk');
aws.config.loadFromPath('./email_config.json');
var ses = new aws.SES({
  apiVersion: '2010-12-01'
});
var to = ['ar@twyst.in']
var from = 'ar@twyst.in'

ses.sendEmail({
  Source: from,
  Destination: {
    ToAddresses: to
  },
  Message: {
    Subject: {
      Data: 'A Message To You Rudy'
    },
    Body: {
      Text: {
        Data: 'Stop your messing around',
      }
    }
  }
}, function(err, data) {
  if (err) {
    console.log("Error");
    console.log(err);
  } else {
    console.log('Email sent:');
    console.log(data);
  }
});
