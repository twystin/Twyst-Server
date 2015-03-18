var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ar@twyst.in',
        pass: 'Tingu1976'
    }
});

// var payload = {
//     from: 'Arun Rajappa ✔ ar@twyst.in', // sender address
//     to: 'ar@twyst.in, al@twyst.in, rc@twyst.in', // list of receivers
//     subject: 'Daily analytics report for: ' + day + '/' + month + '/' + year +'✔', // Subject line
//     text: 'Analytics report.', // plaintext body
//     html: '<b>Analytics report.</b>', // html body,
//     attachments: [{
//         // filename and content type is derived from path
//             path: './data/report.zip'
//     }]
// };

module.exports.send = function(to, payload, success, error) {
    transporter.sendMail(payload, function(err, info){
        if (err) {
            error(err);
        } else{
            success(info);
        }
    });
}
