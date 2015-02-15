var yeller = require('../../index');

describe("error_formatter", function () {
  var err;
  try {
      throw new Error('message');
  } catch (e) {
      err = e;
  }

  it("formats the stacktrace from an error", function () {
    var formatted = yeller.formatError(err);
    expect(formatted.stacktrace.length).not.toEqual(0);
  });

  it("gets the type", function () {
    var formatted = yeller.formatError(err);
    expect(formatted.type).toEqual('Error');
  });

  it("gets the message", function () {
    var formatted = yeller.formatError(err);
    expect(formatted.type).toEqual('Error');
  });

  it("passes along custom data", function () {
    var formatted = yeller.formatError(err, {customData: {user_id : 1}});
    expect(formatted['custom-data']).toEqual({user_id: 1});
  });

  it("passes along url", function () {
    var formatted = yeller.formatError(err, {url: 'http://example.com/posts/1'});
    expect(formatted.url).toEqual('http://example.com/posts/1');
  });

  it("passes along location", function () {
    var formatted = yeller.formatError(err, {location: 'MyHandler'});
    expect(formatted.location).toEqual('MyHandler');
  });

  it("passes along host", function () {
    var formatted = yeller.formatError(err, {host: 'example.com'});
    expect(formatted.host).toEqual('example.com');
  });

  describe("formatFrames", function () {
    it("mark in app frames if they start with the project root", function () {
        var formatted = yeller.formatFrames([{fileName: "/app/app.js"}], "/app");
        expect(formatted[0][3]).toEqual({"in-app" : true});
    });

    it("doesn't mark in app frames if they don't start with the project root", function () {
        var formatted = yeller.formatFrames([{fileName: "/app/app.js"}], "/var/www/things");
        expect(formatted[0][3]).toEqual(undefined);
    });

    it("doesn't mark in app frames if they are under ./node_modules", function () {
        var formatted = yeller.formatFrames([{fileName: "/app/node_modules/library.js"}], "/app");
        expect(formatted[0][3]).toEqual(undefined);
    });

    it("doesn't mark in app frames if there is no project root", function () {
        var formatted = yeller.formatFrames([{fileName: "/app/app.js"}], null);
        expect(formatted[0][3]).toEqual(undefined);
    });
  });
});
