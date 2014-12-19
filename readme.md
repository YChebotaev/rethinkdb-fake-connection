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

caveats
-------

`.patch(r)` will patch `require(rethinkdb/net).isConnection` and `r.connect` methods.

after patching, `r.connect` will return `FakeConnection` instance, that have `.promise`, `.connection` and `._start` properties

`._start` is proxy method that checks if there is `.connection` availible and if its not, add a `then` callback to `.promise` that will call original connection's `_start` method

after patching, `require(rethinkdb/net).isConnection` will accept original and `FakeConnection` instances as valid connections

`FakeConnection#promise` are cancellable promise, so if there will be error while connecting, `.promise` will cancelled with given error