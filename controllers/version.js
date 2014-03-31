'use strict';
var settings = require('../config/settings');
module.exports.getVersion = function (req, res) {
    res.send({'status': 'success',
        'message': 'Login successful',
        'info': JSON.stringify(settings.values.version)});
};