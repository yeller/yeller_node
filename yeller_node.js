var https = require('https');

var DEFAULT_CLIENTS = [
  'collector1.yellerapp.com',
  'collector2.yellerapp.com',
  'collector3.yellerapp.com',
  'collector4.yellerapp.com',
  'collector5.yellerapp.com',
];


var YellerClient = function (token, clients) {
  this.token = token;
  this.clients = clients;
  this.maxRetryCount = this.clients.length * 2;
};

YellerClient.prototype.rotateClients = function () {
  var lastClient = this.clients.shift();
  this.clients.push(lastClient);
};

YellerClient.prototype.reportAndHandleRetries = function (error, currentRequestCount, callback) {
  var that = this;

  var yellerCallback = function (res) {
    that.rotateClients();
    if (res.statusCode === 200) {
      callback();
    } else if (currentRequestCount < that.maxRetryCount)  {
      that.reportAndHandleRetries(error, currentRequestCount + 1, callback);
    } else {
      callback(res);
    }
  };
  var req = https.request({
    host: this.clients[0],
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
  var clients = opts.clients || DEFAULT_CLIENTS.slice(0);
  return new YellerClient(opts.token, clients);
};

module.exports = {
  client: client
};
