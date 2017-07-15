# monadic-js #

This libary provides implementations of some common monads. These include

  * Async
    * Represents an Asynchronous computation
    * Side-effect free until ran
  * Either
    * Represents a value that can be a result or an error
    * Can be mapped into an Async
  * Maybe
    * Represents a value or Nothing
    * Can be mapped into an Async
  * Free
    * Free monads over a Functor
    * Do not use: This will be replaced by the operational monad
    * Implement DSLs as monads
  * Parser
    * Applicative + Alternative + Monadic Parser combinators
    * Method names based on Parsimmon
    * Works with Left recursive grammmars
  * State
    * The normal old State monad

# Array and Function Prototype extensions

Array is extended so it fulfills the fantasy-land Monad, Functor, Appplicative, and Alternative
specifications. You must opt-in to this by calling monadic.ArrayExtensions.addExtensions.

The function prototype is extended so it fulfills the Monad and Functor specifications. It additionally
supports Kleisi compositition and alternative operations (lifted over monads and alternatives).

# Do notation & Expresssion Extensions #
This library provides language extensions to normal JavaScript code by calling the monadic.loadDo function. When
you call this function you can use do notation and some useful operators for composing algebraic structures.

Do notation:
```
do Monad {
  a <- MonadResultOne()
  b <- MonadResultTwo()
  return a + b
}
```

Expressions:
```
const a = expr { fn <$> ap <*> ap2 };
```

Expression extensions can be used in a do-notation block.
  
# Parallel computation #

Functions can be execute in parallel using Async.parallel

```
const monadic = require('monadic-js');
const Worker = require('webworker-threads');
const Async = monadic Async;
const par = Async.parallel(Worker);

function fib(n) {
  function fibr(n) {
    return n > 1 ? fibr(n - 1) + fibr(n - 2) : 1;
  }
  
  return fibr(n - 1);
}

const add = x => y => z => x + y + z;

const parFib = par(fib);

const res = expr { add <$> parFib(30) <*> parFib(40) <*> parFib(40) };

res.fork(x => console.log(x), e => console.error(e));
```

# Planned Features #
Applicative Do
  * Desugar do-notation into applicative bindings where appropriate.
  
# More Info #
Read the full API documentation [documentation.html](documentation).

