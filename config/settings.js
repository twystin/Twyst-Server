'use strict';

module.exports.values = {
    'static': '../web_apps',
    'db': 'mongodb://localhost/twyst',
    'env': 'LOCAL', // options LOCAL, DOGFOOD, PROD
    'config': {
        'LOCAL' : {
            'server': 'http://localhost',
            'port': 3000,
            "clientID": "1437891089774348",
            "clientSecret":"91fd1408e1a0ae47a6542d6e043bacb8",
            "callbackURL":"/api/v1/auth/facebook/callback",
            'db': {
                user: 'twyst',
                pwd: 'Twyst123',
                auth_db: 'twyst'
            }
        },
        'DOGFOOD' : {
            'server': 'http://dogfood.twyst.in',
            'port': 80,
            "clientID": "1437891089774348",
            "clientSecret":"91fd1408e1a0ae47a6542d6e043bacb8",
            "callbackURL":"/api/v1/auth/facebook/callback",
            'db': {
                user: 'twyst',
                pwd: 'Twyst123',
                auth_db: 'twyst'
            }
        },
        'STAGING' : {
            'server': 'http://staging.twyst.in',
            'port': 80,
            "clientID": "1397475420510454",
            "clientSecret":"ff3a95d056a5adf670022a741f65582f",
            "callbackURL":"/api/v1/auth/facebook/callback",
            'db': {
                user: 'twyst_code',
                pwd: 'G1nkgnss6ndagrom',
                auth_db: 'twyst'
            }
        },
        'PROD' : {
            'server': 'http://www.twyst.in',
            'port': 80,
            "clientID": "763534923659747",
            "clientSecret":"673eceff400c5dde837fdedead53ce20",
            "callbackURL":"/api/v1/auth/facebook/callback",
            'db': {
                user: 'twyst_code',
                pwd: 'G5dnmsgs1qsmgacf',
                auth_db: 'twyst'
            }
        }
    },
    'version': {
        "client": "2",
        "api": "1",
        "status": "stable",
        "info": {
            "description": "some description",
            "additional": "additional info"
        }
    }
};