var db = db.getSiblingDB('twyst');
var cursor = db.accounts.find();
while(cursor.hasNext()) {
  c = cursor.next();
  db.accounts.update({_id: c._id }, {
    $set: {
      user: c._id
    }
  });
}
