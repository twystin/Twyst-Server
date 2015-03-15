var csv = require('csv');
var fs = require('fs');
 
// Retrieve
var mongoclient = require('mongodb').MongoClient;
 
// Connect to the db
mongoclient.connect("mongodb://localhost:27017/twyst", function (err, db) {
    if (err) {
        console.log("Unable to connect to database");
    }
    else {
        var Outlets = db.collection('outlets');
        csv()
        .from.stream(fs.createReadStream(__dirname + '/offers.csv', { encoding: 'utf8' }))
        .on('record', function (row, index) {
            if (index >= 0 && index < 4) {
                console.log(row[0]);
                console.log(row[1]);
                var outlet = { 'basics': {'name': row[0], 'merchant_name': row[1]}};
                Outlets.insert(outlet, function (err, result) {
                    if (err) {
                        console.log("*************************");
                        console.log("Index " + index);
                        console.log("Save to database issue");
                        console.log(err);
                        console.log("*************************");
                    }
                });
            }
        })
        .on('end', function (count) {
            console.log('Number of lines: ' + count);
        })
        .on('error', function (error) {
            console.log(error.message);
        });
    }
})