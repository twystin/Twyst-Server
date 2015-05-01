var config = require('./common/config_jobs');
var s = config.values;

module.exports.run = function(success, error) {
  var date = new Date();
  if (!s.debug) {
    exec("mongodump --host " + s.env[s.active]['DBIP'] + " --db twyst --out ./job_data/backup/" + date.getHours(),
      function(err, stdout, stderr) {
        if (err instanceof Error) {
          error(err);
        }
        success("DB Backup completed");
      });
  } else {
    success("Debug mode: Backup would usually run here...!")
  }

}
