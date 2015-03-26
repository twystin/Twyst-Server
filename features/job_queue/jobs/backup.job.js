module.exports.run = function(success, error) {
  var fs = require('fs');
  var sys = require('sys')
  var exec = require('child_process').exec;

  var host_name = "50.112.253.131";
  var date = new Date();
  exec(
    "mongodump --host " + host_name + " --db twyst --out ./backup/" + date.getHours(),
    function(err, stdout, stderr) {
      if (err instanceof Error) {
        error(err);
      }
      success("DB Backup completed");
    });
}
