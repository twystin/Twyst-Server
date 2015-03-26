'use strict';
module.exports.setHMS = function setHMS(date, h, m, s) {
  date.setHours(h || 0);
  date.setMinutes(m || 0);
  date.setSeconds(s || 0);
  return date;
}
