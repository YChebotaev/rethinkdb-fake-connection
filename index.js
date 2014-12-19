function FakeConnection(promise, callback){
  var self = this;
  self.connection = null;
  self.Promise = promise.constructor;
  self.promise = promise
    .cancellable()
    .nodeify(function(err, connection){
      var deferred = self.Promise.defer();
      if (err == null && typeof callback === 'function'){
        if (callback.length >= 3){
          callback.call(self, err, connection, function(err){
            if (err != null) deferred.reject(err);
            deferred.resolve(connection);
          });
        } else {
          promise = callback.call(self, err, connection);
          if (promise != null && typeof promise.then === 'function'){
            promise.then(function(){
              deferred.resolve(connection);
            }, function(err){
              deferred.reject(err);
            });
          } else {
            deferred.resolve(connection);
          }
        }
      } else 
      if (err != null) {
        deferred.reject(err);
      } else {
        deferred.resolve(connection);
      }
      return deferred.promise;
    })
    .then(function(connection){
      return self.connection = connection;
    }, function(err){
      self.promise.cancel(err);
    });
}

FakeConnection.prototype._start = function(term, cb, options){
  var self = this;
  if (self.connection == null){
    self.promise.then(function(connection){
      connection._start(term, cb, options);
    }, cb);
  } else {
    self.connection._start(term, cb, options);
  }
}

FakeConnection.prototype.then = function(resolved, rejected){
  return this.promise.then(function(connection){
    resolved(connection);
  }, function(error){
    rejected(error);
  });
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