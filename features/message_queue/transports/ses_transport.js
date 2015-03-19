var aws = require('aws-sdk');

module.exports.send = function(to, payload, success, error) {
  aws.config.loadFromPath('./ses_config.json');
  var ses = new aws.SES({
    apiVersion: '2010-12-01'
  });

  ses.sendEmail(payload, function(err, data) {
    if (err) {
      error(err);
    } else {
      successs(data);
    }
  });
}
