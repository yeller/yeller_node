var https = require('https');
var stackTrace = require('stack-trace');
var os = require('os');

var formatFrames = function (frames) {
  var result = [];
  for (var i in frames) {
    var frame = frames[i];
    result.push([frame.file, frame.lineNumber + ':' + frame.columnNumber, frame.functionName]);
  }
  return result;
};

var formatError = function (e, options) {
  var opts = options || {};
  var stacktrace = stackTrace.parse(e);
  return {
      stacktrace: formatFrames(stacktrace),
      type: e.name || 'Error',
      message: e.message,
      'custom-data': opts.custom_data,
      url: opts.url,
      location: opts.location,
      host: opts.host,
  };
};

var DEFAULT_ENDPOINTS = [
  'collector1.yellerapp.com',
  'collector2.yellerapp.com',
  'collector3.yellerapp.com',
  'collector4.yellerapp.com',
  'collector5.yellerapp.com',
];

var VERSION = "yeller_node: 0.0.1";

var YellerClient = function (options) {
  this.token = options.token;
  this.endpoints = options.endpoints;
  this.maxRetryCount = this.endpoints.length * 2;
  this.startup_options = {
    application_environment: options.application_environment,
    host: options.host,
  };
};

YellerClient.prototype.rotateEndpoint = function () {
  var lastEndpoint = this.endpoints.shift();
  this.endpoints.push(lastEndpoint);
};

YellerClient.prototype.formatJSONError = function (error, options) {
  var formatted = formatError(error, options);
  formatted['application-environment'] = this.startup_options.application_environment;
  formatted.host = this.startup_options.host;
  formatted['client-version'] = VERSION;
  return JSON.stringify(formatted);
};

YellerClient.prototype.reportAndHandleRetries = function (error, options, currentRequestCount, callback) {
  var that = this;

  var yellerCallback = function (res) {
    that.rotateEndpoint();
    if (res.statusCode === 200) {
      callback();
    } else if (currentRequestCount < that.maxRetryCount)  {
      that.reportAndHandleRetries(error, options, currentRequestCount + 1, callback);
    } else {
      callback(res);
    }
  };
  var json = that.formatJSONError(error, options);
  var req = https.request({
    host: this.endpoints[0],
    path: '/' + this.token,
    method: 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Content-Length' : json.length
    },
  },
  yellerCallback);
  req.write(json);
  req.end();
};

YellerClient.prototype.report = function(error, opts, callback) {
  var options = opts || options;
  this.reportAndHandleRetries(error, options, 1, callback);
};

var client = function(opts) {
  if (!opts.endpoints) {
    opts.endpoints = DEFAULT_ENDPOINTS.slice(0);
  }
  if (!opts.application_environment) {
    opts.application_environment = 'production';
  }
  if (!opts.host) {
    opts.host = os.hostname();
  }
  return new YellerClient(opts);
};

module.exports = {
  client: client,
  formatError: formatError
};
