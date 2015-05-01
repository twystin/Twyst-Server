var mongoose = require('mongoose');
var Coupon = mongoose.model('Coupon');
var Offer = mongoose.model('Offer');
var async = require('async');
var _ = require("underscore");
var keygen = require("keygenerator");

module.exports.create = function(req, res) {
  var created_coupon = {};
  created_coupon = _.extend(created_coupon, req.body);
  created_coupon.basics.code = keygen._({
    forceUppercase: true,
    length: 6,
    exclude: ['O', '0', 'L', '1']
  });
  var coupon = new Coupon(created_coupon);

  saveCoupon(coupon, function(err) {
    if (err) {
      res.send(400, {
        'status': 'error',
        'message': 'Error saving coupon.',
        'info': err
      });
    } else {
      res.send(200, {
        'status': 'success',
        'message': 'Saved coupon successfully.',
        'info': ''
      });
    }
  })
}

module.exports.update = function(req, res) {
  var updated_coupon = {};
  updated_coupon = _.extend(updated_coupon, req.body);

  updateCoupon(updated_coupon, function(err) {
    if (err) {
      res.send(400, {
        'status': 'error',
        'message': 'Error updating coupon.',
        'info': err
      });
    } else {
      res.send(200, {
        'status': 'success',
        'message': 'Updated coupon successfully.',
        'info': ''
      });
    }
  })
}

function updateCoupon(coupon, cb) {
  var id = coupon._id;
  delete coupon._id;
  Coupon.findOneAndUpdate({
    _id: id
  }, {
    $set: coupon
  }, {
    upsert: true
  }, function(err, coupon) {
    cb(err, coupon);
  })
}

function saveCoupon(coupon, cb) {
  coupon.save(function(err) {
    cb(err);
  })
}

module.exports.read = function(req, res) {
  var user_id = req.user._id;
  readCoupons(user_id, function(err, coupons) {
    if (err) {
      res.send(400, {
        'status': 'error',
        'message': 'Error getting coupons.',
        'info': err
      });
    } else {
      res.send(200, {
        'status': 'success',
        'message': 'Got coupons successfully.',
        'info': coupons
      });
    }
  })

  function readCoupons(user_id, callback) {
    Coupon.find({
        'accounts': user_id
      })
      .populate('outlets')
      .exec(function(err, coupons) {
        callback(err, coupons);
      })
  }
}

module.exports.readOne = function(req, res) {
  var coupon_id = req.params.coupon_id;
  var user_id = req.user._id
  if (!coupon_id) {
    res.send(400, {
      'status': 'error',
      'message': 'Unexpected request format.',
      'info': ''
    });
  } else {
    readOneCoupon(coupon_id, user_id, function(err, coupon) {
      if (err) {
        res.send(400, {
          'status': 'error',
          'message': 'Error getting coupon.',
          'info': err
        });
      } else {
        res.send(200, {
          'status': 'success',
          'message': 'Got coupon successfully.',
          'info': coupon
        });
      }
    })
  }

  function readOneCoupon(coupon_id, user_id, callback) {
    Coupon.findOne({
        'accounts': user_id,
        _id: coupon_id
      })
      .populate('outlets')
      .exec(function(err, coupon) {
        callback(err, coupon);
      })
  }
}

module.exports.delete = function(req, res) {
  var coupon_id = req.params.coupon_id;
  var user_id = req.user._id;
  if (!coupon_id) {

  } else {
    archiveCoupon(coupon_id, user_id, function(err, coupon) {
      if (err) {
        res.send(400, {
          'status': 'error',
          'message': 'Error deleting coupon.',
          'info': err
        });
      } else {
        res.send(200, {
          'status': 'success',
          'message': 'Deleted coupon successfully.',
          'info': ''
        });
      }
    });
  }

  function archiveCoupon(coupon_id, user_id, callback) {
    Coupon.findOne({
      _id: coupon,
      accounts: user_id
    }, function(err, coupon) {
      if (err) {
        callback(err, coupon);
      } else if (!coupon) {
        callback("Coupon not found", coupon);
      } else {
        coupon.status = 'archived';
        delete coupon.__v;
        coupon.save(function(err) {
          callback(err, null);
        })
      }
    })
  }
}
