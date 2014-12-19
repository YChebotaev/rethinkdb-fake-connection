rethinkdb-fake-connection
=========================

Module that helps with promised connections to rethinkdb database.

installation
------------

there is no npm package for this module, use `package.json` manually

```bash
npm install --save YChebotaev/rethinkdb-fake-connection
```

usage
-----

```javascript
var r = require('rethinkdb');
require('rethinkdb-fake-connection').patch(r);

var fakeConnection = r.connect();

r.dbList().run(fakeConnection, function(err, dbList){
  console.log(err, dbList); // null, ["test"]
});
```

FakeConnection#then
-------------------

there is also `.then` helper method that proxied to a `.promise.then` method call

```javascript
fakeConnection.then(function(connection){
  return r.dbList().run(connection);
});
```

all `.then` callbacks will be called only after actual `.connection` arrived

connection ready hook
---------------------

since `r.connect` is now always returs "valid" connection, there is special meaning for `r.connect(function(err, connection))` callback.

this callback is now have **before all other requests** meaning. this means that this callback is guaranteed to invoked before any other database requests once connection it availible

**note** that `err` argument in callback is always `null` because if there will be actual error, `.promise` will be rejected with this error

`r.connect` method is now overloaded as following:

```function
r.connect(function(err, connection){
  return "any non-promise value has no effect";
});

r.connect(function(err, connection){
  // Promises are counts
  return r.dbCreate('foo').run(connection);
});

r.connect(function(err, connection, done){
  r.dbCreate('foo').run(connection, done);
});
```

**note** that you cannot use `done` with Promise. you only able to return promise from this callback if you have less than 3 parameters in function signature. besides if you have `done` parameter in function signature, you cannot return Promise from this callback

caveats
-------

`.patch(r)` will patch `require(rethinkdb/net).isConnection` and `r.connect` methods.

after patching, `r.connect` will return `FakeConnection` instance, that have `.promise`, `.connection` and `._start` properties

`._start` is proxy method that checks if there is `.connection` availible and if its not, add a `then` callback to `.promise` that will call original connection's `_start` method

after patching, `require(rethinkdb/net).isConnection` will accept original and `FakeConnection` instances as valid connections

`FakeConnection#promise` are cancellable promise, so if there will be error while connecting, `.promise` will cancelled with given error