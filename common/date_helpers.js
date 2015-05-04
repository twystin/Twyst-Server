module.exports.common = {
  'day': 86400000,
  '_5min': 300000
};


module.exports.time_diff = function time_diff(d) {
  return d ? (Date.now() - new Date(d)) : false;
};
