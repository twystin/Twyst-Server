var crypto = require('crypto');
options = {};
options.saltlen = options.saltlen || 32;
options.iterations = options.iterations || 25000;
options.keylen = options.keylen || 512;
    
options.hashField = options.hashField || 'hash';
options.saltField = options.saltField || 'salt';
function getHashSalt(password, cb) {
    crypto.randomBytes(options.saltlen, function(err, buf) {
        if(err) {
            cb(err);
        }
        else {
            var salt = buf.toString('hex');
            crypto.pbkdf2(password, 
                salt, 
                options.iterations, 
                options.keylen, 
            function(err, hashRaw) { 
                if(err) {
                    cb(err);
                }
                else {
                    var data = {
                        hash: new Buffer(hashRaw, 'binary').toString('hex'),
                        salt: salt
                    }
                    cb(null, data);
                }
            });
        }
    });
}

getHashSalt('retwyst', function(err, pass) {
    console.log(err + ' ' + JSON.stringify(pass))
} )