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
        var Offers = db.collection('offers');
        csv()
        .from.stream(fs.createReadStream(__dirname + '/offers.csv', { encoding: 'utf8' }))
        .on('record', function (row, index) {
            if (index >= 0 && index < 3) {
                console.log(row[0]);
                console.log(row[1]);
                var offer = {'basics':{'title': row[0], 'description': row[1]}};
                Offers.insert(offer, function (err, result) {
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