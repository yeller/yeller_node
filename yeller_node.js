var https = require('https');

var DEFAULT_ENDPOINTS = [
  'collector1.yellerapp.com',
  'collector2.yellerapp.com',
  'collector3.yellerapp.com',
  'collector4.yellerapp.com',
  'collector5.yellerapp.com',
];


var YellerClient = function (token, endpoints) {
  this.token = token;
  this.endpoints = endpoints;
  this.maxRetryCount = this.endpoints.length * 2;
};

YellerClient.prototype.rotateEndpoint = function () {
  var lastEndpoint = this.endpoints.shift();
  this.endpoints.push(lastEndpoint);
};

YellerClient.prototype.reportAndHandleRetries = function (error, currentRequestCount, callback) {
  var that = this;

  var yellerCallback = function (res) {
    that.rotateEndpoint();
    if (res.statusCode === 200) {
      callback();
    } else if (currentRequestCount < that.maxRetryCount)  {
      that.reportAndHandleRetries(error, currentRequestCount + 1, callback);
    } else {
      callback(res);
    }
  };
  var req = https.request({
    host: this.endpoints[0],
    path: '/' + this.token,
    method: 'POST'
  },
  yellerCallback);
  // handle request errors
  // handle request timeouts
  req.end();
};

YellerClient.prototype.report = function(error, callback) {
  this.reportAndHandleRetries(error, 1, callback);
};

var client = function(opts) {
  var endpoints = opts.endpoints || DEFAULT_ENDPOINTS.slice(0);
  return new YellerClient(opts.token, endpoints);
};

module.exports = {
  client: client
};
