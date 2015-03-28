var aws = require('aws-sdk');

module.exports.send = function(to, payload, success, error) {
  aws.config.update({
    "accessKeyId": "AKIAJTAQ7XF55TQMK5FA",
    "secretAccessKey": "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",
    "region": "us-west-2"
  });
  var ses = new aws.SES({
    apiVersion: '2010-12-01'
  });

  ses.sendEmail(payload, function(err, data) {
    if (err) {
      error(err);
    } else {
      success(data);
    }
  });
}
