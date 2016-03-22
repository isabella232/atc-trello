"use strict";

const tap = require('tap');
const sinon = require('sinon');
const http = require('http');
const trello = require('node-trello');
const common = require('./common');
const util = require('../util');
const webhookServer = require('../webhookServer');

tap.test('Webhook server class', t1 => {
  const sandbox = sinon.sandbox.create();

  t1.afterEach(done => {
    sandbox.restore();
    done();
  });

  t1.test('constructor', t2 => {
    const fails = [
      { name: 'with non-numeric port', value: 'string' },
      { name: 'with negative port', value: -34 },
      { name: 'with huge port', value: 352342 }
    ];

    for(const fail of fails) {
      t2.test(fail.name, t3 => {
        function wrapper() {
          new webhookServer(fail.value);
        }

        t3.throws(wrapper, 'throws an exception');
        t3.done();
      });
    }

    t2.test('with valid port', t3 => {
      const validPort = 9000;

      const isValidWH = function(o, t) {
        t.equal(typeof o, 'object', 'creates an object');
        t.equal(typeof o.start, 'function', 'object has a start function');
        t.equal(typeof o.on, 'function', 'object has an on function');
        t.equal(typeof o.cleanup, 'function', 'object has a cleanup function');
      }

      t3.afterEach(done => {
        common.resetEnvVars();
        done();
      });

      t3.test('with no API key or API token', t4 => {
        delete process.env.TRELLO_API_KEY;
        delete process.env.TRELLO_API_TOK;
        function wrapper() {
          new webhookServer(validPort);
        }

        t4.throws(wrapper, 'throws an exception');
        t4.done();
      });

      t3.test('with no API key but an API token', t4 => {
        delete process.env.TRELLO_API_KEY;
        process.env.TRELLO_API_TOK = 'token';
        function wrapper() {
          new webhookServer(validPort);
        }

        t4.throws(wrapper, 'throws an exception');
        t4.done();
      });

      t3.test('with an API key but no API token', t4 => {
        process.env.TRELLO_API_KEY = 'key';
        delete process.env.TRELLO_API_TOK;

        const wh = new webhookServer(validPort);
        isValidWH(wh, t4);
        t4.done();
      });


      t3.test('with an API key and an API token', t4 => {
        process.env.TRELLO_API_KEY = 'key';
        process.env.TRELLO_API_TOK = 'token';

        const wh = new webhookServer(validPort);
        isValidWH(wh, t4);
        t4.done();
      });

      t3.done();
    });
    t2.done();
  });

  t1.test('start', t2 => {
    const port = 9000;
    let wh;
    let createServerMock;
    let listenMock;
    let getHostnameMock;
    let trelloPostMock;

    let test = 0;
    let hostname = null;
    let trelloError = null;

    t2.beforeEach(done => {
      getHostnameMock = sandbox.stub(util, 'getHostname');
      if(hostname) {
        getHostnameMock.resolves(hostname);
      } else {
        getHostnameMock.rejects('No hostname');
      }
      listenMock = sandbox.stub().yields();
      createServerMock = sandbox.stub(http, 'createServer').returns({
        listen: listenMock
      });
      trelloPostMock = sandbox.stub(trello.prototype, 'post').yields(trelloError, { id: 'webhook-id' });
      process.env.TRELLO_API_KEY = 'key';
      wh = new webhookServer(port);
      done();
    });

    t2.afterEach(done => {
      common.resetEnvVars();
      sandbox.restore();
      test++;
      switch(test) {
        case 1:
          hostname = null;
          trelloError = new Error('Test Error');
          break;
        case 2:
          hostname = 'hostname';
          trelloError = null;
          break;
        case 3:
          hostname = 'hostname';
          trelloError = new Error('Test Error');
          break;
        default:
          hostname = null;
          trelloError = null;
          break;
      }
      done();
    });

    t2.test('with invalid hostname and no Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      getHostnameMock().then(() => {
        t3.fail('getHostname rejects');
        t3.done();
      }).catch(() => {
        t3.pass('getHostname rejects');
        whStart.then(() => {
          t3.fail('webhook server start rejects');
          t3.done();
        }).catch(() => {
          t3.pass('webhook server start rejects');
          t3.done();
        });
      });
    });

    t2.test('with invalid hostname and Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      getHostnameMock().then(() => {
        t3.fail('getHostname rejects');
        t3.done();
      }).catch(() => {
        t3.pass('getHostname rejects');
        whStart.then(() => {
          t3.fail('webhook server start rejects');
          t3.done();
        }).catch(() => {
          t3.pass('webhook server start rejects');
          t3.done();
        });
      });
    });

    t2.test('with valid hostname and no Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      t3.equal(listenMock.callCount, 1, 'calls server.listen once');
      t3.equal(listenMock.args[0][0], port, 'listens on the specified port');
      console.log(`Hostname: ${hostname}`);

      getHostnameMock().then(() => {
        t3.pass('getHostname resolves');
        t3.equal(trelloPostMock.callCount, 1, 'calls trello.post once');
        t3.equal(trelloPostMock.args[0][0], '/1/webhooks', 'posts to /1/webhooks');
        t3.equal(trelloPostMock.args[0][1].callbackURL, hostname, 'registers its hostname as the callback');
        t3.equal(trelloPostMock.args[0][2].idModel, process.env.ATC_TRELLO_BOARD_ID, 'registers for events from the ATC Trello board');

        whStart.then(() => {
          t3.pass('webhook server start resolves');
          t3.done();
        }).catch(() => {
          t3.fail('webhook server start resolves');
          t3.done();
        });
      }).catch(() => {
        t3.fail('getHostname resolves');
      });
    });

    t2.test('with valid hostname and Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      t3.equal(listenMock.callCount, 1, 'calls server.listen once');
      t3.equal(listenMock.args[0][0], port, 'listens on the specified port');

      getHostnameMock().then(() => {
        t3.pass('getHostname resolves');
        t3.equal(trelloPostMock.callCount, 1, 'calls trello.post once');
        t3.equal(trelloPostMock.args[0][0], '/1/webhooks', 'posts to /1/webhooks');
        t3.equal(trelloPostMock.args[0][1].callbackURL, hostname, 'registers its hostname as the callback');
        t3.equal(trelloPostMock.args[0][2].idModel, process.env.ATC_TRELLO_BOARD_ID, 'registers for events from the ATC Trello board');

        whStart.then(() => {
          t3.fail('webhook server start rejects');
          t3.done();
        }).catch(() => {
          t3.pass('webhook server start rejects');
          t3.done();
        });
      }).catch(() => {
        t3.fail('getHostname resolves');
        t3.done();
      });
    });

    t2.done();
  });

  t1.test('on', t2 => {
    process.env.TRELLO_API_KEY = 'key';
    const wh = new webhookServer(9000);

    wh.on('data', () => { });
    t2.pass('no exception');

    common.resetEnvVars();
    t2.done();
  });

  t1.test('cleanup', t2 => {
    process.env.TRELLO_API_KEY = 'key';
    const wh = new webhookServer(9000);

    t2.test('with no webhook', t3 => {
      wh.cleanup().then(() => {
        t3.pass('cleanup resolves');
        t3.done();
      }).catch(() => {
        t3.fail('cleanup resolves');
        t3.done();
      });
    });

    t2.test('with a webhook and a Trello error', t3 => {
      wh._webhookID = 'webhook-id';
      const trelloDelMock = sandbox.stub(trello.prototype, 'del').yields(new Error('Test Error'), null);

      wh.cleanup().then(() => {
        t3.pass('cleanup resolves');
        t3.done();
      }).catch(() => {
        t3.fail('cleanup resolves');
        t3.done();
      });
    });

    t2.test('with a webhook and no Trello error', t3 => {
      wh._webhookID = 'webhook-id';
      const trelloDelMock = sandbox.stub(trello.prototype, 'del').yields(null, '');

      wh.cleanup().then(() => {
        t3.pass('cleanup resolves');
        t3.done();
      }).catch(() => {
        t3.fail('cleanup resolves');
        t3.done();
      });
    });

    common.resetEnvVars();
    t2.done();
  });

  t1.done();
})
