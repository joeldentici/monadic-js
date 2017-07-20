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
  * ConcurrentFree
    * Free monads over an ADT
    * Implement DSLs as ADTs and compose instructions monadically
    * Supports concurrent execution with Applicative binding
  * Parser
    * Applicative + Alternative + Monadic Parser combinators
    * Method names based on Parsimmon
    * Works with Left recursive grammmars
  * State
    * The normal old State monad
    
## Installation
Currently not on NPM. There are still a couple of things that need to be done before it is ready for release.

## Array and Function Extensions
Array and its prototype are extended so it fulfills the fantasy-land Monad, Functor, Appplicative, and Alternative
specifications. You must opt-in to this by calling `monadic.ArrayExtensions.addExtensions`.

The function prototype is extended so it fulfills the Monad and Functor specifications. It additionally supports Kleisi compositition and alternative operations (lifted over monads and alternatives). Care should be taken with alternative composition of functions if the rhs may contain non-algebraic side effects as it is always applied to the input, even if its result is ignored when the resulting alternative is executed.

## Do notation & Expression Extensions
This library provides language extensions to normal JavaScript code by calling the `monadic.loadDo function`. When
you call this function you can use do notation and some useful operators for composing algebraic structures. This will always load the Array and Function extensions.

### Do notation:
```js
do Monad {
  a <- MonadResultOne()
  b <- MonadResultTwo()
  c = pureComputation(a, b)
  do! someOtherAction
  
  return a + b + c
}
```

Unlike Haskell's do-notation, sequenced actions must be explicitly bound to the next statement by using `do!`. This is to allow normal JS side effects to be performed in other statements. If this wasn't the case, then side-effecting non-monadic statements would need to be explicitly bound to a variable, or we would have to introduce something similar to `do!` to distinguish them. It makes more sense to distinguish monadic actions by notation than non-monadic side-effects, so that is what is done -- after all, we are in a do-notation block.

### Expressions:
```js
const a = expr { fn <$> ap <*> ap2 };
```

Expression extensions can be used in a do-notation block, and a do-notation block can be the expression of an expression block. Despite this, expression blocks should only be used when you have a single expression you want to use directly from JS code, as nesting them in themeselves or in do-blocks is redundant and parentheses suffice for raising precedence. Do-blocks can be nested as well and should be where appropriate.

### If-Else
Not shown above are if-else expressions which replace normal JS conditionals and the ternary operator inside the expression extensions/do-notation. These are expression based like the ternary operator, not statement based like an if-elseif-else in JS. Here is an example:

```js
const a = expr { if (9 < 10) expr1 else expr2 } // a === expr1
```

Todo: Include link to document of grammar for do-notation/expression extensions.

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

Keep in mind that if you use monadic composition (`.chain`,`.bind`,`>>=`,`>>`,`>=>`) then you will completely lose the benefits of parallel execution. This is because monadic composition is inherently sequential. Because the provided do-notation does not yet rewrite into applicative composition where possible, avoid using do-notation with `Async.parallel`.

The final thing to note is that a function used with `Async.parallel` cannot be partially applied and it cannot be higher-order in the sense of resulting in a function. In the first case we would lose the environment of the function on the main thread when sending it to the WebWorker and in the second case we would lose the environment of the resulting function when sending it back to the main thread. If you try to use a partially applied function you will receive a ReferenceError when you execute the async computation. If you try to return a function you will receive a CurryingError when you execute the async function. In either case, it is ensured that your async computation will fail rather than give bad results. Your function can be higher-order in the sense of having function parameters, but again this argument must not be partially applied, or you will get a ReferenceError. Finally note that the first two rules mean you must use functions that do not curry their parameters (they must take an argument list). None of this should be a problem since the main purpose of `Async.parallel` is to aid with the execution of CPU-bound functions.

## Parser combinators
Parser combinators are provided that roughly follow the interface of Parsimmon. Unlike Parsimmon, these parsers support memoization of results and use a modification to a not well known enough algorithm to support left-recursion in a top-down parse without grammar knowledge (which can be used to perform automated rewrites of the grammar for parser generators). This allows keeping the modularity of parser combinators and their other benefits (such as generic non-terminals that curry arguments, something that doesn't exist in formal grammar specifications), while supporting left-recursion.

Informal analysis of theoretical complexity shows the following complexities for CFG (only a left-most parse is generated, but any deterministic CFG can be parsed, not just LL(\*) grammars) using only applicative composition and alternation (which is all that is needed to parse a CFG and probably the most efficient, though you can implement it in other manners). It is also assumed that you choose to memoize any parsers that may be applied more than once during the parse. The complexity is a function of `n`, the length of input to be parsed:

  * Non left-recursive CFG: `O(n log n)`
  * Left-recursive CFG: `O(n^2 log n)`
  
The `O(log n)` part of the complexity comes from the fact that we are using persistent maps for memoization and left-recursion detection. The `O(n)` part in the first case is due to the fact that we must apply each parser at most once to each input position due to memoization. The `O(n^2)` part in the second case is due to the fact that we may have to apply each parser to each input position `n` times (we detect left recursion at each input position, for each parser tried).

## Planned Features
Applicative Do
  * Desugar do-notation into applicative bindings where appropriate.
  
Proper fantasy-land methods
  * Right now the fantasy-land methods are not 'namespaced' properly.
  * This will be done before release on NPM
  
## More Info
Read the full API documentation [documentation.html](documentation.html).
