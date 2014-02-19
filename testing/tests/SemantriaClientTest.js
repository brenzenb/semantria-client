/**
 *  Tests for SemantriaClient.js
 */

"use strict";

var SemantriaClient = require('../../lib/SemantriaClient');
var Q = require('q');
var fs = require('fs');
var MonkeyPatcher = require('capsela-util').MonkeyPatcher;
var nock = require('nock');
var https = require('https');
var EventEmitter = require('events').EventEmitter;

exports['create'] = {
    'success' : function(test) {
        var client = SemantriaClient.create('','');

        test.ok(client);

        test.done();
    }
};

exports['retrieveConfigurations'] = {
  'success, matches once' : function (test) {
    var c = SemantriaClient.create('','');
    var mockConfigs = [
      {
        param: 'not_value'
      },
      {
        param: 'value'
      }
    ];

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, null);
      return Q.resolve(JSON.stringify(mockConfigs));
    };

    c.retrieveConfigurations('param', 'value').then(
      function (result) {
        test.deepEqual(result, [mockConfigs[1]]);
        test.done();
      }
    )
  },
  'success, matches twice' : function (test) {
    var c = SemantriaClient.create('','');
    var mockConfigs = [
      {
        param: 'value'
      },
      {
        param: 'value'
      }
    ];

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, null);
      return Q.resolve(JSON.stringify(mockConfigs));
    };

    c.retrieveConfigurations('param', 'value').then(
      function (result) {
        test.deepEqual(result, mockConfigs);
        test.done();
      }
    )
  },
  'success, no matches' : function (test) {
    var c = SemantriaClient.create('','');
    var mockConfigs = [
      {
        param: 'not_value'
      }
    ];

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, null);
      return Q.resolve(JSON.stringify(mockConfigs));
    };

    c.retrieveConfigurations('param', 'value').then(
      function (result) {
        test.deepEqual(result, []);
        test.done();
      }
    )
  },
  'failure' : function (test) {
    var c = SemantriaClient.create('','');

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, null);
      return Q.reject('Error');
    };

    c.retrieveConfigurations('param', 'value').fail(
      function (err) {
        test.equal(err, 'Error');
        test.done();
      }
    )
  },
  'success, no parameters' : function (test) {
    var c = SemantriaClient.create('','');

    var mockConfigs = [
      {
        param: 'not_value'
      }
    ];

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, null);
      return Q.resolve(JSON.stringify(mockConfigs));
    };

    //When no parameters are passed in, return everything
    //When a single parameter is passed in, return nothing.
    c.retrieveConfigurations().then(
      function (result) {
        test.deepEqual(result, mockConfigs);
        test.done();
      }
    )
  },
  'failure, one parameter only' : function (test) {
    var c = SemantriaClient.create('','');

    var mockConfigs = [
      {
        param: 'not_value'
      }
    ];

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, null);
      return Q.resolve(JSON.stringify(mockConfigs));
    };

    //When a single parameter is passed in, return an error.
    c.retrieveConfigurations('single').fail(
      function (err) {
        test.equal(err, 'Must include both parameter & value, or neither');
        test.done();
      }
    )
  }
};

exports['updateConfiguration'] = {
  setUp: function(cb) {
    MonkeyPatcher.setUp(cb);

  },

  tearDown: function(cb) {
    MonkeyPatcher.tearDown(cb);
  },
  'success' : function (test) {
    var c = SemantriaClient.create('','');
    var configJSON = {
      "test": "abc"
    };

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'POST');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, configJSON);
      return Q.resolve('update');
    };

    c.updateConfiguration(configJSON).then(
      function (result) {
        test.equal(result, 'update');
        test.done();
      }
    )
  }
};

exports['deleteConfiguration'] = {
  'success' : function (test) {
    var c = SemantriaClient.create('','');
    var mockIds = ['abc'];
    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'DELETE');
      test.equal(endpoint, 'https://api30.semantria.com/configurations.json');
      test.equal(postData, mockIds);
      return Q.resolve('delete');
    };

    c.deleteConfiguration(mockIds).then(
      function (result) {
        test.equal(result, 'delete');
        test.done();
      }
    )
  }
};

exports['queueDocument'] = {
  'success' : function(test) {

    var c = SemantriaClient.create("","");

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'POST');
      test.equal(endpoint, 'https://api30.semantria.com/document.json');
      test.deepEqual(postData, {
        text:'sweet content',
        id : '1234'
      });
      return Q.resolve('stuff');
    };

    test.expect(4);

    c.queueDocument('sweet content', '1234').then(
      function(result) {
        test.equal(result, 'stuff');
        test.done();
      }
    );
  },
  'success with configId' : function (test) {
    var c = SemantriaClient.create('123','abc');

    c.execute = function(method, endpoint, postData) {
      test.equal(method, 'POST');
      test.equal(endpoint, 'https://api30.semantria.com/document.json?config_id=mockConfig');
      test.deepEqual(postData, {
        text:'sweet content',
        id : '1234'
      });
      return Q.resolve('stuff');
    };

    test.expect(4);

    c.queueDocument('sweet content', '1234', 'mockConfig').then(
      function(result) {
        test.equal(result, 'stuff');
        test.done();
      }
    );
  }
};

exports['queueDocumentBatch'] = {
    'success' : function(test) {

        var c = SemantriaClient.create('','');

        c.execute = function(method, endpoint, postData) {
            test.equal(method, 'POST');
            test.equal(endpoint, 'https://api30.semantria.com/document/batch.json');
            test.deepEqual(postData, contents);
            return Q.resolve('stuff');
        };

        test.expect(4);

        var contents = [{id : 123, contents : 'abc'}, {id : 124, contents : 'xyz'}];

        c.queueDocumentBatch(contents).then(
            function(result) {
                test.equal(result, 'stuff');
                test.done();
            }
        );

    },
    'success, specific configId' : function(test) {

      var c = SemantriaClient.create('','');

      c.execute = function(method, endpoint, postData) {
        test.equal(method, 'POST');
        test.equal(endpoint, 'https://api30.semantria.com/document/batch.json?config_id=mockConfig');
        test.deepEqual(postData, contents);
        return Q.resolve('stuff');
      };

      test.expect(4);

      var contents = [{id : 123, contents : 'abc'}, {id : 124, contents : 'xyz'}];

      c.queueDocumentBatch(contents, 'mockConfig').then(
        function(result) {
          test.equal(result, 'stuff');
          test.done();
        }
      );

    },

    'will reject on batch larger than 10' : function(test) {
        var c = SemantriaClient.create('','');

        c.execute = function() {
          test.fail();
        };

        test.expect(1);

        var docs = [{id : 123, contents : 'abc'}, {id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'},{id : 124, contents : 'xyz'}];

        c.queueDocumentBatch(docs).fail(
            function(err) {
                test.equal(err, 'batch too large');
                test.done();
            }
        );
    }
};

exports['requestDocument'] = {

    'success' : function(test) {
        var c = SemantriaClient.create('','');

        c.execute = function(method, endpoint) {

            test.equal(method, 'GET');
            test.equal(endpoint, 'https://api30.semantria.com/document/1234.json');

            return Q.resolve('stuff');
        };

        test.expect(3);

        c.requestDocument('1234').then(
            function(result) {
                test.equal(result, 'stuff');
                test.done();
            }
        );
    },
    'success, specific configId' : function(test) {
      var c = SemantriaClient.create('','');

      c.execute = function(method, endpoint) {

        test.equal(method, 'GET');
        test.equal(endpoint, 'https://api30.semantria.com/document/1234.json?config_id=mockConfig');

        return Q.resolve('stuff');
      };

      test.expect(3);

      c.requestDocument('1234', 'mockConfig').then(
        function(result) {
          test.equal(result, 'stuff');
          test.done();
        }
      );
    }
};

exports['retrieveDocumentBatch'] = {
  'success' : function(test) {
    var c = SemantriaClient.create('','');

    c.execute = function(method, endpoint) {

      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/document/processed.json');

      return Q.resolve('stuff');
    };

    test.expect(3);

    c.retrieveDocumentBatch().then(
      function(result) {
        test.equal(result, 'stuff');
        test.done();
      }
    );
  },
  'success, specific configId' : function(test) {
    var c = SemantriaClient.create('','');

    c.execute = function(method, endpoint) {

      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/document/processed.json?config_id=mockConfig');

      return Q.resolve('stuff');
    };

    test.expect(3);

    c.retrieveDocumentBatch('mockConfig').then(
      function(result) {
        test.equal(result, 'stuff');
        test.done();
      }
    );
  }
};
exports['retrieveCategories'] = {

  'success' : function(test) {
    var c = SemantriaClient.create('','');

    c.execute = function(method, endpoint, postData) {

      test.equal(method, 'GET');
      test.equal(endpoint, 'https://api30.semantria.com/categories.json');
      test.equal(postData.config_id, 'id');

      return Q.resolve('stuff');
    };

    test.expect(4);

    c.retrieveCategories('id').then(
      function(result) {
        test.equal(result, 'stuff');
        test.done();
      }
    );
  }
};

exports['execute'] = {

    setUp: function(cb) {
        MonkeyPatcher.setUp(cb);
    },

    tearDown: function(cb) {
        MonkeyPatcher.tearDown(cb);
    },

    'success with POST' : function(test) {
        var c = SemantriaClient.create('','');

        var address = 'https://api30.semantria.com';
        var endPoint = '/test.json';

        c.sign = function(method, endpoint){
            test.ok(true);
            return {query: endpoint, headers : {}}
        };

        var postData = {
            id : 123,
            content : "content!"
        };

        c.on('processed', function(body){
            test.equal(body, 'hi');
            test.done();
        });
        nock(address)
          .post(endPoint, postData)
          .reply(200, 'hi');

        test.expect(2);

        c.execute('POST', address + endPoint, postData);
    },

    'success with GET' : function(test) {
        var c = SemantriaClient.create('','');

        var address = 'https://api30.semantria.com';
        var endPoint = '/test.json';

        c.sign = function(method, endpoint){
            test.ok(true);
            return {query: endpoint, headers : {}}
        };

        nock(address)
          .get(endPoint)
          .reply(202, 'hi');

        test.expect(2);

        c.execute('GET', address + endPoint).then(
            function(r) {
                test.equal(r, 'hi');
                test.done();
            }
        ).end();
    },

    'will reject on a non 202 or 200 status code' : function(test) {
        var c = SemantriaClient.create('','');

        var address = 'https://api30.semantria.com';
        var endPoint = '/test.json';

        c.sign = function(method, endpoint){
            test.ok(true);
            return {query: endpoint, headers : {}}
        };

        var postData = {
            id : 123,
            content : "content!"
        };

        nock(address)
          .post(endPoint, postData)
          .reply(500, 'internalError');

        test.expect(1);

        c.execute('POST', address + endPoint, postData).fail(
          function() {
            test.done();
          }
        ).end();
    },

    'will reject on http error' : function(test) {

        var mockHttps = new EventEmitter();

        MonkeyPatcher.patch(https, 'request', function() {
            mockHttps.end = function() {
                test.ok(true);
            };
            return mockHttps;
        });

        test.expect(2);

        var c = SemantriaClient.create("a","b");

        c.execute('GET', 'https://www.google.com').fail(
            function(err){
                test.equal(err, 'this is the error');
                test.done();
            }
        );

        mockHttps.emit('error', 'this is the error');
    }
};

