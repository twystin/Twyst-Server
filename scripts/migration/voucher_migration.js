var db = db.getSiblingDB('twyst');
var cursor = db.vouchers.find();
while(cursor.hasNext()) {
  a = cursor.next();
  db.users.update({_id:a.issue_details.issued_to},{
    $push: {
      coupons: {
        code: a.basics.code,
        outlets: a.issue_details.issued_to,
        title: a.basics.description,
        detail: a.basics.description,
        expiry: a.validity.end_date,
        reward_meta: null,
        used_details: {
          used_time: a.used_details && a.used_details.used_time,
          used_by: a.used_details && a.used_details.used_by,
          used_at: a.used_details && a.used_details.used_at,
          used_phone: a.redemption_phone_number
        },
        status: a.basics.status,
        issued: a.issue_details.issue_date
      }
    }
  }, {
    multi: true
  });
}
