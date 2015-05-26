db.vouchers.find({'issue_details.issue_date': {$gte: new Date('04/15/2015')}, 
  'issue_details.program': ObjectId('54e1b1fe43b1aaf274a320b7')}).forEach(
  function(voucher) {
    if(voucher) {
      var date = new Date(voucher.issue_details.issue_date);
      date.setDate(date.getDate() + 35);
      db.vouchers.update({
        _id: voucher._id
      }, {
        $set: {
          'validity.start_date': voucher.issue_details.issue_date,
          'validity.end_date': date
        }
      })
    }
    
  }
)



