var yeller = require('../../yeller_node');
var nock = require('nock');

describe('yeller', function () {
  it("reports an error to yeller's api", function (done) {
    var api = nock('https://collector1.yellerapp.com')
                    .post('/API_TOKEN')
                    .reply(200, 'success');
    nock.disableNetConnect();
    var client = yeller.client({token: 'API_TOKEN'});
    try {
      throw new Error('test error');
    } catch (e) {
      client.report(e, function () {
        api.done();
        done();
      });
    }
  });
});
