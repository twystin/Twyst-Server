var settings = require('./config/settings');
(function () {
    'use strict';
    var express = require('express'),
        app = express();
    require('./config/config_app')(app);
    require('./config/config_models')();
    var restify = require('express-restify-mongoose');
    var Deal = require('./models/deal');
    var router = express.Router();
    restify.serve(router, Deal);

    require('./config/config_routes')(app);

    // START THE SERVER!
    console.log('STARTING THE TWYST SERVER');
    console.log('-------------------------');
    console.log('Environment:' + settings.values.env);
    console.log('URL:' + settings.values.config[settings.values.env].server);
    console.log('Port:' + settings.values.config[settings.values.env].port);
    app.listen(settings.values.config[settings.values.env].port);
    console.log('Started the server');
    process.on('uncaughtException', function (error) {
        console.log(error.stack);
        console.log(error);
    });
})();
