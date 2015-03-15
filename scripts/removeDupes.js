// Script that removes multiple users in the database
// While consolidating the social information and voucher information

var mongoose = require('mongoose')

_ = require('underscore');
require('../config/config_models')();

mongoose.connect('mongodb://50.112.253.131/twyst');

var Account = mongoose.model('Account'),
  Voucher = mongoose.model('Voucher'),
  Favs = mongoose.model('Favourite');

var count = 0;

//Finds multipler users in the DB
Account.aggregate({
  $match: {}
}, {
  $group: {
    _id: {
      phone: '$phone'
    },
    ids: {
      $push: '$_id'
    }
  }
}, function(err, op) {
  console.log(op)
  op.forEach(function(o) {
    if (o.ids.length > 1) {
      processUser(o);
    }
  });
});

function processUser(o) {
  if (o._id.phone) {
    hasSocial(o.ids, function(err, user) {
      if (err) {

      } else {
        if (user) {
          var main = user._id,
            others = _.filter(o.ids, function(item) {
              return !item.equals(main);
            });
          console.log(main)
          console.log(others)
          updateVoucher(main, others);
        } else {
          var main = o.ids[0],
            others = o.ids.slice(1);
          updateVoucher(main, others);
        }
      }
    });
  }
}

function updateVoucher(main, others) {
  Voucher.update({
    'issue_details.issued_to': {
      $in: others
    }
  }, {
    'issue_details.issued_to': main
  }, {
    multi: true
  }, function(err, done) {
    console.log(err || 'success');
    removeAccounts(main, others);
  })
}

function removeAccounts(main, others) {
  Account.remove({
      _id: {
        $in: others
      }
    })
    .exec(function(err, done) {
      console.log(err || done);
    })
}

function hasSocial(users, cb) {
  Account.findOne({
      _id: {
        $in: users
      },
      social_graph: {
        $exists: true
      }
    })
    .exec(function(err, user) {
      cb(err, user);
    })
}
