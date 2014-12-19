function FakeConnection(promise, callback){
  var self = this;
  self.connection = null;
  self.promise = promise.cancellable().then(function(connection){
    self.connection = connection;
    return self;
  }, function(err){
    self.promise.cancel(err);
  }).nodeify(callback);
}

FakeConnection.prototype._start = function(term, cb, options){
  var self = this;
  if (self.connection == null){
    self.promise.then(function(connection){
      connection._start(term, cb, options);
    });
  } else {
    self.connection._start(term, cb, options);
  }
}

exports.patch = function(r){
  var rnet = require('rethinkdb/net');
  var _isConnection = rnet.isConnection;
  var _connect = r.connect;
  rnet.isConnection = function(connection){
    return connection instanceof FakeConnection || _isConnection(connection);
  }
  r.connect = function(config, callback){
    if (typeof config === 'function'){
      callback = config;
      config = {};
    }

    var promise = _connect.call(r, config);

    return new FakeConnection(promise, callback);
  }
  return exports;
}