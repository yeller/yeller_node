var yeller = require('../../index');
var nock = require('nock');

describe('yeller', function () {
  afterEach(function () {
    nock.cleanAll();
  });
  var ignoringErrorHandler = {
      ioError: function (err) {},
      authError: function (err) {},
    };

  it("reports an error to yeller's api", function (done) {
    var api = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(200, 'success');
    nock.disableNetConnect();
    var client = yeller.client({token: 'API_TOKEN', errorHandler: ignoringErrorHandler});
    try {
      throw new Error('test error');
    } catch (e) {
      client.report(e, {}, function () {
        api.done();
        done();
      });
    }
  });

  it("submits an error to multiple endpoints", function (done) {
    var api1 = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(200, 'success');
    var api2 = nock('https://collector2.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(200, 'success');
    nock.disableNetConnect();
    var client = yeller.client({token: 'API_TOKEN', errorHandler: ignoringErrorHandler});
    try {
      throw new Error('test error');
    } catch (e) {
      client.report(e, {}, function () {
        api1.done();
        client.report(e, {}, function () {
          api2.done();
          done();
        });
      });
    }
  });

  it("submits an error again when the first endpoint fails", function (done) {
    var api1 = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    var api2 = nock('https://collector2.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(200, 'success');
    nock.disableNetConnect();
    var client = yeller.client({token: 'API_TOKEN', errorHandler: ignoringErrorHandler});
    try {
      throw new Error('test error');
    } catch (e) {
      client.report(e, {}, function () {
        api1.done();
        api2.done();
        done();
      });
    }
  });

  it("resubmits errors until an api succeeds", function (done) {
    var api1 = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    var api2 = nock('https://collector2.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    var api3 = nock('https://collector3.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    var api4 = nock('https://collector4.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    var api5 = nock('https://collector5.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(200, 'success');
    nock.disableNetConnect();
    var client = yeller.client({token: 'API_TOKEN', errorHandler: ignoringErrorHandler});
    try {
      throw new Error('test error');
    } catch (e) {
      client.report(e, {}, function () {
        api1.done();
        api2.done();
        api3.done();
        api4.done();
        api5.done();
        done();
      });
    }
  });

  it("stops resubmitting when it's done too many retries", function (done) {
    var api1 = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    var api2 = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(500, 'THE BEES ARE IN MY EYES');
    nock.disableNetConnect();
    var client = yeller.client({
        token: 'API_TOKEN',
        endpoints: ['collector1.yellerapp.com'],
        errorHandler: ignoringErrorHandler,
    });
    try {
      throw new Error('test error');
    } catch (e) {
      client.report(e, {}, function () {
        api1.done();
        api2.done();
        done();
      });
    }
  });
});
