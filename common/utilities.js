var _ = require('underscore');
var dateFormat = require('dateformat');

module.exports.formatDate = function(date) {
    return dateFormat(date, "mmmm dS yyyy, h:MM:ss");
}

module.exports.calculateDistance = function(a, b) {

	var p1 = {latitude: point1.latitude, longitude: point1.longitude};
    var p2 = {latitude: point2.latitude, longitude: point2.longitude};

	var R = 6371; // km
    if (typeof (Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function() {
            return this * Math.PI / 180;
        };
    }

    if (!p1 || !p2) {
        return 100; 
        //return null;
    };

    var dLat = (p2.latitude-p1.latitude).toRad();
    var dLon = (p2.longitude-p1.longitude).toRad();
    
    var lat1 = p1.latitude.toRad();
    var lat2 = p2.latitude.toRad();

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    
    return d.toFixed(1);
}