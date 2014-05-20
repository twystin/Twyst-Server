var _ = require('underscore');
var dateFormat = require('dateformat');

module.exports.formatDate = function(date) {
    return dateFormat(date, "d mmmm yyyy");
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


module.exports.replaceAll = function(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
}

module.exports.rewardify = function (input) {
    if (input.reward.custom && input.reward.custom.text) {
        return input.reward.custom.text;
    } else if (input.reward.flat && (input.reward.flat.off || input.reward.flat.spend)) {
        if(input.reward.flat.off && input.reward.flat.spend) {
            return "Get Rs." + ifEmpty(input.reward.flat.off) + " off on a minimum spend of Rs." + ifEmpty(input.reward.flat.spend);
        }
        if(input.reward.flat.off) {
            return "Get Rs." + ifEmpty(input.reward.flat.off) + " off";
        }
    } else if (input.reward.free && (input.reward.free.title || input.reward.free._with)) {
        if(input.reward.free.title && input.reward.free._with) {
            return "Get a free " + ifEmpty(input.reward.free.title) + " with " + ifEmpty(input.reward.free._with);
        }
        if(input.reward.flat.off) {
            return "Get a free " + ifEmpty(input.reward.free.title);
        }
    } else if (input.reward.buy_one_get_one && input.reward.buy_one_get_one.title) {
        return "Get " + ifEmpty(input.reward.buy_one_get_one.title);
    } else if (input.reward.reduced && (input.reward.reduced.what || input.reward.reduced.worth || input.reward.reduced.for_what)) {
        if(input.reward.reduced.what && input.reward.reduced.worth) {
           return "Get " + ifEmpty(input.reward.reduced.what) + " worth Rs. " + ifEmpty(input.reward.reduced.worth) + " for Rs. " + ifEmpty(input.reward.reduced.for_what);
        }
    } else if (input.reward.happyhours && input.reward.happyhours.extension) {
        return "Extended happy hours by " + ifEmpty(input.reward.happyhours.extension);
    } else if (input.reward.discount) {
        if (input.reward.discount.max) {
            return "Get " + ifEmpty(input.reward.discount.percentage) + " off, subject to a maximum discount of Rs." + ifEmpty(input.reward.discount.max);
        } else {
            return "Get " + ifEmpty(input.reward.discount.percentage) + " off";
        }
    } else {
        return ifEmpty(input.basics.description);
    }

    function ifEmpty(input) {
        if(input) {
            return input;
        }
        return '';
    }
}

module.exports.setCurrentTime = function (oldDate) {
    if(!oldDate) {
        return null;
    }
    var date = new Date();

    var newDate = new Date(oldDate);
    return newDate.setHours(
        date.getHours(), 
        date.getMinutes(), 
        date.getSeconds(),
        date.getMilliseconds());
}