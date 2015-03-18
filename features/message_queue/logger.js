// These should take care of sending email, sms also.

module.exports.alert = function(data, email, sms) {
  console.log(data);
};

module.exports.notify = function(data, email, sms) {
  console.log(data);
};

module.exports.success = function(data, email, sms) {
  console.log(data);
};

module.exports.error = function(data, email, sms) {
  console.log(data);
};

module.exports.fatal = function(data, email, sms) {
  console.log(data);
};

module.exports.getStatusObject = function(status, message, info) {
    return {
      status: status,
      message: message,
      info: info
    }
};
