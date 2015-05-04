module.exports.response = function(o) {
  if (!o.error) {
    o.response.status(200).send({
      'response': true,
      'message': o.success_message,
      'data': o.success_data
    });
  } else {
    o.response.status(200).send({
      'response': false,
      'status': o.error_data,
      'data': o.error_message
    });
  }
};
