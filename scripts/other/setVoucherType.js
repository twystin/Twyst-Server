db.vouchers.find({'basics.type': 'CHECKIN', 'checkin_details.checkin_id': {$exists: true}}).forEach(
  function(voucher) {
    if(voucher.checkin_details && voucher.checkin_details.checkin_id) {
      db.checkins.find({'_id': voucher.checkin_details.checkin_id}).forEach(
        function(checkin) {
          db.vouchers.update({
            '_id': voucher._id
          }, {
            $set: {
              'basics.gen_type': checkin.checkin_type
            }
          }
        )

      }) 
    }
    else {
      printjson(voucher.checkin_details);
    }
  }
)
