var settings = require('./common/config_jobs').values;
var helper = require('./common/helper');
console.log(settings.env[settings.active]['DB']);
console.log(helper.setHMS(new Date(), 10,10,10));
