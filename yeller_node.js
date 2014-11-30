var https = require('https');

var YellerClient = function (token) {
  this.token = token;
};

YellerClient.prototype.report = function(error, callback) {
  var yellerCallback = function () {
    callback();
  };
  var req = https.request({
    host: 'collector1.yellerapp.com',
    path: '/' + this.token,
    method: 'POST'
  },
  yellerCallback);
  req.end();
};

var client = function(opts) {
  return new YellerClient(opts.token);
};

module.exports = {
  client: client
};