var db = db.getSiblingDB('twyst');
var cursor = db.checkins.find();
while(cursor.hasNext()) {
  c = cursor.next();
  var a = db.accounts.find({phone:c.phone});

  db.events.insert({
    _id: c._id,
    event_type: 'checkin',
    event_date: c.checkin_date,
    event_user: a.next()._id,
    event_outlet: c.outlet,
    event_meta: {
      "checkin_program" : c.checkin_program,
      "checkin_tier" : c.checkin_tier,
      "checkin_code" : c.checkin_code,
      "checkin_type" : c.checkin_type,
      "checkin_for" : c.checkin_for,
    }
  });
}
