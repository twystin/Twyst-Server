var async = require('async');

async.parallel({
    one: function(callback) {
        callback(null, 'abc\n');
    },
    two: function(callback) {
        callback(null, 'xyz\n');
    }
}, function(err, results) {
    console.log(results)
});