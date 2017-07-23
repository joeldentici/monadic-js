## Parallel computation
Functions can be execute in parallel using `Async.parallel`. This requires a WebWorker implementation to be installed by your project.

```js
const monadic = require('monadic-js');
const Worker = require('webworker-threads');
const Async = monadic.Async;
const par = Async.parallel(Worker);

function fib(n) {
  function fibr(n) {
    return n > 1 ? fibr(n - 1) + fibr(n - 2) : 1;
  }
  
  return fibr(n);
}

const add = x => y => z => x + y + z;

const parFib = par(fib);

const res = expr { add <$> parFib(30) <*> parFib(40) <*> parFib(40) };

res.fork(x => console.log(x), e => console.error(e));
```
These functions are actually running in parallel, using kernel threads, as in on multiple cores (unless you are somehow on a machine that isn't multicore in 2017). If you run this on a single-core machine you will see normal old time-sharing/slicing concurrency, which is the same thing Async will get you on Node.js's single thread (and it might be slower because of context switching on a CPU-bound workload).

As you can see, `Async.parallel` wraps a WebWorker implementation so it can wrap a function to execute in a WebWorker context (in this case using kernel threads) when it is applied. You can see this with the fibonacci sequence naive recursive definition being wrapped as parFib. This wrapped function's result is put into an Async context so that its uses, as well as the uses of other parallel functions, can be composed using the monadic and applicative interfaces of Async. You can see an example using applicative application with a curried 3-ary add function (using the expression extension operators).

Keep in mind that if you use monadic composition (`.chain`,`.bind`,`>>=`,`>>`,`>=>`) then you will completely lose the benefits of parallel execution. This is because monadic composition is inherently sequential. Because the provided do-notation does not yet rewrite into applicative composition where possible, avoid using do-notation with `Async.parallel`. You can use expressions consisting of applicative composition of `Async.parallel` within do-notation or monadic composition chains. Doing so will preserve parallel execution across each applicative expression.

The final thing to note is that a function used with `Async.parallel` cannot be partially applied and it cannot be higher-order in the sense of resulting in a function. In the first case we would lose the environment of the function on the main thread when sending it to the WebWorker and in the second case we would lose the environment of the resulting function when sending it back to the main thread. If you try to use a partially applied function you will receive a ReferenceError when you execute the async computation. If you try to return a function you will receive a CurryingError when you execute the async function. In either case, it is ensured that your async computation will fail rather than give bad results. Your function can be higher-order in the sense of having function parameters, but again this argument must not be partially applied, or you will get a ReferenceError. Finally note that the first two rules mean you must use functions that do not curry their parameters (they must take an argument list). None of this should be a problem since the main purpose of `Async.parallel` is to aid with the execution of CPU-bound functions.
