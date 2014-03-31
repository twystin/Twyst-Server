var conn=new Mongo();
var twyst=conn.getDB("twyst");
twyst['accounts'].ensureIndex({home: '2d'})
twyst.outlets.ensureIndex({'contact.location.coords':'2d'})
