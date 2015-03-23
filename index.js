var https = require('https');
var stackTrace = require('stack-trace');
var os = require('os');

var formatFrames = function (frames, project_root) {
  var result = [];
  for (var i in frames) {
    var frame = frames[i];
    if (project_root && frame.fileName.lastIndexOf(project_root, 0) === 0 && frame.fileName.indexOf("node_modules") === -1) {
      result.push([frame.fileName, frame.lineNumber + ':' + frame.columnNumber, frame.functionName, {"in-app" : true}]);
    } else {
      result.push([frame.fileName, frame.lineNumber + ':' + frame.columnNumber, frame.functionName]);
    }
  }
  return result;
};

var formatError = function (e, options, project_root) {
  var opts = options || {};
  var stacktrace = stackTrace.parse(e);
  return {
      stacktrace: formatFrames(stacktrace, project_root),
      type: e.name || 'Error',
      message: e.message,
      'custom-data': opts.customData,
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
  this.errorHandler = options.errorHandler;
  this.startupOptions = {
    applicationEnvironment: options.applicationEnvironment,
    host: options.host,
  };
  this.developmentEnvironments = options.developmentEnvironments;
  this.project_root = options.project_root || process.cwd();
};

YellerClient.prototype.rotateEndpoint = function () {
  var lastEndpoint = this.endpoints.shift();
  this.endpoints.push(lastEndpoint);
};

YellerClient.prototype.formatJSONError = function (error, options) {
  var formatted = formatError(error, options, this.project_root);
  formatted['application-environment'] = this.startupOptions.applicationEnvironment;
  formatted.host = this.startupOptions.host;
  formatted['client-version'] = VERSION;
  return JSON.stringify(formatted);
};

YellerClient.prototype.handleFailure = function (jsonError, currentRequestCount, callback, error) {
  if (currentRequestCount < this.maxRetryCount)  {
      this.reportAndHandleRetries(jsonError, currentRequestCount + 1, callback);
  } else {
    callback(error);
    this.errorHandler.ioError(error);
  }
};

YellerClient.prototype.reportAndHandleRetries = function (jsonError, currentRequestCount, callback) {
  var that = this;

  var yellerCallback = function (res) {
    that.rotateEndpoint();
    if (res.statusCode === 200) {
      callback();
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      that.errorHandler.authError(res);
      callback();
    } else {
      that.handleFailure(jsonError, currentRequestCount, callback, res);
    }
  };
  var req = https.request({
    host: this.endpoints[0],
    path: '/' + this.token,
    method: 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Content-Length' : jsonError.length
    },
  },
  yellerCallback);
  req.write(jsonError);
  req.setTimeout(10000, function (err) {
    if (err === undefined) {
      that.handleFailure(jsonError, currentRequestCount, callback, new Error('Yeller: timed out sending the error to servers'));
    } else {
      that.handleFailure(jsonError, currentRequestCount, callback, err);
    }
  });
  req.on('error', function (err) {
    that.handleFailure(jsonError, currentRequestCount, callback, err);
  });
  req.end();
};

YellerClient.prototype.report = function(error, opts, call) {
  var options = opts || options;
  var callback = call || function() {};
  var json = this.formatJSONError(error, options);
  this.reportAndHandleRetries(json, 1, callback);
};

var YellerIgnoringClient = function () {
};

YellerIgnoringClient.prototype.report = function (e, opts, callback) {
  callback();
};

var client = function(opts) {
  if (!opts.endpoints) {
    opts.endpoints = DEFAULT_ENDPOINTS.slice(0);
  }
  if (!opts.applicationEnvironment) {
    opts.applicationEnvironment = 'production';
  }
  if (!opts.host) {
    opts.host = os.hostname();
  }
  if (!opts.errorHandler) {
    opts.errorHandler = {
      ioError: function (err) {
                 console.log(err);
                 console.log(err.stack);
               },
      authError: function (err) {
                 console.log(err);
                 console.log(err.stack);
               },
    };
  }
  if (!opts.developmentEnvironments) {
    opts.developmentEnvironments = ['development', 'test'];
  }
  for (var i in opts.developmentEnvironments) {
    var env = opts.developmentEnvironments[i];
    if (env === opts.applicationEnvironment) {
      return new YellerIgnoringClient();
    }
  }
  return new YellerClient(opts);
};

module.exports = {
  client: client,
  formatError: formatError,
  formatFrames: formatFrames,
};
