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
    * Based on [haskell-free-concurrent](https://github.com/srijs/haskell-free-concurrent/)
  * Parser
    * Applicative + Alternative + Monadic Parser combinators
    * Method names based on [Parsimmon](https://github.com/jneen/parsimmon)
    * Works with Left recursive grammmars thanks to [X-SAIGA](http://hafiz.myweb.cs.uwindsor.ca/proHome.html)
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

Keep in mind that if you use monadic composition (`.chain`,`.bind`,`>>=`,`>>`,`>=>`) then you will completely lose the benefits of parallel execution. This is because monadic composition is inherently sequential. Because the provided do-notation does not yet rewrite into applicative composition where possible, avoid using do-notation with `Async.parallel`. You can use expressions consisting of applicative composition of `Async.parallel` within do-notation or monadic composition chains. Doing so will preserve parallel execution across each applicative expression.

The final thing to note is that a function used with `Async.parallel` cannot be partially applied and it cannot be higher-order in the sense of resulting in a function. In the first case we would lose the environment of the function on the main thread when sending it to the WebWorker and in the second case we would lose the environment of the resulting function when sending it back to the main thread. If you try to use a partially applied function you will receive a ReferenceError when you execute the async computation. If you try to return a function you will receive a CurryingError when you execute the async function. In either case, it is ensured that your async computation will fail rather than give bad results. Your function can be higher-order in the sense of having function parameters, but again this argument must not be partially applied, or you will get a ReferenceError. Finally note that the first two rules mean you must use functions that do not curry their parameters (they must take an argument list). None of this should be a problem since the main purpose of `Async.parallel` is to aid with the execution of CPU-bound functions.

## Parser combinators
Parser combinators are provided that roughly follow the interface of Parsimmon. Unlike Parsimmon, these parsers support memoization of results and use a modification to a not well known enough algorithm to support left-recursion in a top-down parse without grammar knowledge (which can be used to perform automated rewrites of the grammar for parser generators). This allows keeping the modularity of parser combinators and their other benefits (such as generic non-terminals that curry arguments, something that doesn't exist in formal grammar specifications), while supporting left-recursion.

Informal analysis of theoretical complexity shows the following complexities for CFG (only a left-most parse is generated, but any deterministic CFG can be parsed, not just LL(\*) grammars) using only applicative composition and alternation (which is all that is needed to parse a CFG and probably the most efficient, though you can implement it in other manners). It is also assumed that you choose to memoize any parsers that may be applied more than once during the parse. The complexity is a function of `n`, the length of input to be parsed:

  * Non left-recursive CFG: `O(n log n)`
  * Left-recursive CFG: `O(n^2 log n)`
  
The `O(log n)` part of the complexity comes from the fact that we are using persistent maps for memoization and left-recursion detection. The `O(n)` part in the first case is due to the fact that we must apply each parser at most once to each input position due to memoization. The `O(n^2)` part in the second case is due to the fact that we may have to apply each parser to each input position `n` times (we detect left recursion at each input position, for each parser tried).

TODO: Move above to separate page and give examples

## ConcurrentFree - DSLs from ADTs
The Free Monad is a somewhat well known construction that allows recovering a Monad from a Functor by providing a construction to allow monadic composition of values in the Functor and a transformation that maps from a value in the Functor to a Monad. In practical terms, this means a Free monad separates the concerns of constructing a program and interpreting a program. It makes this so easy, in fact, that it is very useful for constructing effectful DSLs from pure computations.

The Free Monad can be generalized in many ways, such as relaxing the restriction that it be over a Functor. We can also add some extensions, such as mixing in the Free Applicative, which is nearly the same thing, but for recovering an Applicative. Combining these approaches carefully we wind up with ConcurrentFree, which is able to recover Functor, Applicative, and Monad from an ADT. This construction allows nesting applicative and monadic composition arbitrarily. Transformations from ConcurrentFree to another Monad preserve the applicative structure until monadic composition (chain/bind) is encountered. Because of this, if the semantics of the Applicative instance for the Monad you transform to are concurrent, then use of applicative composition with the Free Monad will be concurrent!

An extension is made to the traditional `foldMap` style interpretation of Free Monads that allows specifying interpreters that perform setup and cleanup operations in the output Monad. This is useful for implementing interpreters that require the creation and disposal of resources (for example, interacting with a database). Interpreters can also be combined, and since this is JavaScript, which lacks a static type system, we can compose operations from different Free Monads with no additional effort.

To sum the process up, you create an ADT and lift your ADT constructors to Free Monad constructors with `ConcurrentFree.liftF`. You create an interpreter that performs any setup and cleanup operations in the output Monad, and which provides a transformation from your ADT to the output Monad. The transformation provides an (informal) operational semantics for your DSL.

### Example of ConcurrentFree
Below is an example of a toy DSL implemented using ConcurrentFree, which demonstrates the preservation of concurrent applicative semantics. A real effectful library can easily be turned into a DSL this way.

```js
const CaseClass = require('js-helpers').CaseClass;
const monadic = require('monadic-js');
const Async = monadic.Async;
const F = monadic.ConcurrentFree;
const {forever} = monadic.Utility;

class Sleep extends CaseClass {
	constructor(ms) {
		super();
		this.ms = ms;
	}

	doCase(fn) {
		return fn(this.ms);
	}
}

class Print extends CaseClass {
	constructor(val) {
		super();
		this.val = val;
	}

	doCase(fn) {
		return fn(this.val);
	}
}

class Error extends CaseClass {
	constructor(val) {
		super();
		this.val = val;
	}

	doCase(fn) {
		return fn(this.val);
	}
}

class Interpreter {
	constructor() {

	}

	setup() {
		console.log("Setup...");
		return Async.of();
	}

	transform(x, transformations) {
		return x.case({
			Sleep: ms => Async.sleep(ms),
			Print: msg => {
				console.log(msg);
				return Async.of();
			},
			Error: err => Async.fail(err),
			default: _ => {}
		});
	}

	cleanupSuccess(v) {
		console.log("Normal Cleanup");
		return Async.of();
	}

	cleanupFail(e) {
		console.log("Fail Cleanup");
		return Async.of();
	}
}

const sleep = ms => F.liftF(new Sleep(ms));
const print = msg => F.liftF(new Print(msg));
const throwE = err => F.liftF(new Error(err));

const interpreter = () => new Interpreter();

const interpret = F.interpret(Async, interpreter);

const prog = do F {
	do! print("hello there!")
	do! sleep(300) *> sleep(500)
	do! do F {
		do! print("f")
		do! print("g")
		sleep(500)
	} *> do F {
		do! print("a")
		do! print("b")
		do! print("h")
		sleep(600)
	}
	//do! throwE("Whoops...")
	do! print("going around forever???")
	do! sleep(1000)
	return "We made it to the end!"
};

//const comp = interpret(forever(prog));
const comp = interpret(prog);

comp.fork(x => console.log(x), e => console.error(e));
```

## Planned Features
Applicative Do
  * Desugar do-notation into applicative bindings where appropriate.
  
Proper fantasy-land methods
  * Right now the fantasy-land methods are not 'namespaced' properly.
  * This will be done before release on NPM
  
## More Info
Read the full API documentation [documentation.html](documentation.html).

## Contributing
Contributions are welcome. Currently just follow the standard fork-commit-push-pull request model. If this gets attention and people want to collaborate I will start an organization for this and we can start coming up with actual guidelines for style and contribution.
