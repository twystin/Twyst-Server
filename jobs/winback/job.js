// Load up the common config file.
var config = require('../common/config_jobs');
var helper = require('../common/helper')
var s = config.values;

// Can I move this to common?
var Transport = require('./transport');


// Load up the models required.
var Voucher = mongoose.model('Voucher'),
  Winback = mongoose.model('Winback'),
  Outlet = mongoose.model('Outlet'),
  Checkin = mongoose.model('Checkin'),
  Account = mongoose.model('Account');

// Conect to the database.
mongoose.connect(s.env[s.active]['DB']);

// Schedule the job to run.
if (!s.debug) {
	var job = schedule.scheduleJob({
		minute: s.jobs.winback.run.minute,
		dayOfWeek: [new schedule.Range(s.jobs.winback.run.begin, s.jobs.winback.run.end)]
	}, main);
} else {
	console.log("DEBUG MODE");
	main();
}

// Get the winback programs.
function getWinbacks(cb) {
  Winback.find({
      'status': 'active',
      'validity.earn_start': {
        $lt: new Date(),
      },
      'validity.earn_end': {
        $gt: new Date(),
      }
    })
    .populate('outlets')
    .exec(function(err, winbacks) {
      cb(err, winbacks);
    })
}

// Get the users who match the program criteria.
function getUsers(winback, cb) {
	Checkin.aggregate({
		$match: {
			outlet: {
				$in: winback.outlets.map(function(o) {
					return mongoose.Types.ObjectId(o._id);
				})
			}
		}
	}, {
		$group: {
			_id: '$phone',
			count: {
				$sum: 1
			},
			dates: {
				$push: '$checkin_date'
			}
		}
	}, {
		$match: {
			count: {
				$gte: winback.min_historical_checkins
			}
		}
	}, function(err, op) {
		cb(err, op);
	})
}

// Get the users who are eligible and create vouchers for them.
function filterUsers(winback, users) {
	var filtered_users = filterByDate(winback, users);
	var winback_filtered_users = [];
	async.each(filtered_users, function (f, callback) {
		hasWinbackAlready(f, winback, function (err, account, status) {
			if(err) {
				callback(err);
			}
			else {
				if(account && !status) {
					winback_filtered_users.push(account);
				}
				callback();
			}
		})
	}, function (err) {
		if(err) {
			console.log("Error filtering user: " + new Date());
		}
		else {
			console.log("Filtered users successfully: " + new Date());
			if(winback_filtered_users.length) {
				generateVouchers(winback, winback_filtered_users);
			}
			else {
				console.log("No user found for this winback: " + winback.name + ' ' + new Date());
			}
		}
	})

	// Get only the users whose last check-in is before the winback program filter date
	function filterByDate(winback, users) {
		var filtered_users = [];
		var date_since_last_visit = helper.setHMS(winback.date_since_last_visit, 23, 59, 59);
		users.forEach(function (u) {
			u.dates = _.sortBy(u.dates, function (d) {
				return -d;
			});
			if(u.dates[0] < date_since_last_visit) {
				filtered_users.push(u);
			}
		});
		return filtered_users;
	}

	// Check if this user already has a winback voucher at this outlet.
	function hasWinbackAlready(user, winback, callback) {
		Account.findOne({
			phone: user._id
		}, function (err, account) {
			if(err) {
				callback(err, account, false);
			}
			else {
				if(!account) {
					callback(err, account, false);
				}
				else {
					hasWinbackVoucherForProgram(account);
				}
			}
		})

		function hasWinbackVoucherForProgram(account) {
			Voucher.findOne({
				'issue_details.issued_to': account._id,
				'issue_details.winback': winback._id
			}, function (err, voucher) {
				if(err) {
					callback(err, account, false);
				}
				else {
					if(voucher) {
						callback(err, account, true);
					}
					else {
						callback(err, account, false);
					}
				}
			})
		}
	}
}

// Now that we have the users we want to create vouchers for
// For each of them, save the voucher and send them a message
function generateVouchers(winback, users, cb) {
		async.each(users, function (u, callback) {
				saveVoucher(u, winback, function (err, voucher) {
					if(err) {
						callback(err);
					}
					else {
						if (!s.debug) {
							Transport.handleMessage(u, winback, voucher);
						} else {
							console.log("Mail would have gone with voucher");
						}
					}
				});
		}, function (err) {
				if(err) {
					console.log("Error saving voucher: "+ new Date());
				}
				else {
					console.log("Done the winback execution");
				}
		})

		// Get the voucher object and save it!
		function saveVoucher(user, winback, cb) {
			var voucher = getVoucherObject(winback, user);
			voucher = new Voucher(voucher);
			if (!s.debug) {
				voucher.save(function (err) {
					cb(err, voucher);
				})
			} else {
				console.log(voucher);
				cb(null, voucher);
			}

		}

		// Generate the voucher object for the winback.
		function getVoucherObject(winback, user) {
			var voucher = {
				basics: {
					code: keygen._({
						forceUppercase: true,
						length: 6,
						exclude:['O', '0', 'L', '1']
					}),
					type: 'WINBACK'
				},
				validity: {
					start_date: new Date(),
							end_date: Date.now() + winback.validity.voucher_valid_days * 86400000,
							number_of_days: winback.validity.voucher_valid_days
				},
				issue_details: {
					winback: winback._id,
					issued_at: winback.outlets.map(function (o) {
						return o._id;
					}),
					issued_to: user._id
				}
			}
			voucher.validity.end_date = new Date(voucher.validity.end_date);
			voucher.validity.end_date = helper.setHMS(voucher.validity.end_date, 23, 59, 59);
			return voucher;
		}
}

// Main function
function main() {
  getWinbacks(function(err, winbacks) {
    if (err) {
      console.log("Error getting winbacks. " + new Date());
    } else {
      if (winbacks && winbacks.length > 0) {
        async.each(winbacks, function(w, callback) {
          if (w.outlets.length > 0) {
            getUsers(w, function(err, users) {
              if (err) {
                callback(err);
              } else {
                filterUsers(w, users);
              }
            });
          } else {
            console.log("Winback has no outlets. Winback ID: " + w._id + ' ' + new Date());
          }
        }, function(err) {
          if (err) {
            console.log("Error executing winbacks: " + new Date());
          } else {
            console.log("Done the winbacks " + new Date());
          }
        })
      } else {
        console.log("No winbacks found currently." + new Date());
      }
    }
  })
};
