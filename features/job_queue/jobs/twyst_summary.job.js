var config = require('./common/config_jobs');
var s = config.values;
var Summary = require('./helpers/twyst_summary/summary');
var RawData = require('./helpers/twyst_summary/rawdata');

module.exports.run = function(success, error) {
  if (!s.debug) {
    async.parallel({
      summary: function(callback) {
        Summary.getCount(callback);
      },
      rawdata: function(callback) {
        RawData.execAsyncCommands(callback);
      }
    }, function(err, results) {
      setTimeout(function() {
        var zip = new admzip();
        fs.exists('./job_data/data/summary.csv', function (exists) {
          if (exists) {
            zip.addLocalFile("./job_data/data/summary.csv");
            fs.exists('./job_data/data/accounts.csv', function (exists) {
              if (exists) {
                zip.addLocalFile("./job_data/data/accounts.csv");
                fs.exists('./job_data/data/vouchers.csv', function (exists) {
                  if (exists) {
                    zip.addLocalFile("./job_data/data/vouchers.csv");
                    zip.writeZip("./job_data/data/report.zip");
                    console.log("CAME HERE -- ZIPPED THE FILE!")
                    success("done");
                  } else {
                    error("File not found - vouchers.csv")
                  }
                });
              } else {
                error("File not found - accounts.csv")
              }
            });
          } else {
            error("File not found - summary.csv")
          }
        });

      }, 120000);

    });
  } else {
    success("Debug mode: Summary would usually run here...!")
  }

}
