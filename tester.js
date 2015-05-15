var oc = require('./controllers/outlet');

oc.getFeatured({
  query: {
    num: 0
  }
}, {
  send: function(c,o) {
    console.log(o);
  }
});
