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

Unlike Haskell's do-notation, sequenced actions must be explicitly bound to the next statement by using `do!`. This is to allow normal JS side effects to be performed in other statements. If this wasn't the case, then side-effecting non-monadic statements would need to be explicitly bound to a variable, or we would have to introduce something similar to `do!` to distinguish them. It makes more sense to distinguish monadic actions by notation than non-monadic side-effects, so that is what is done -- after all, we are in a do-notation block. Note that this does not apply to the last statement in a block (you can still use do!, but it will automatically be removed), which should be a value in the monad.

### Expressions:
```js
const a = expr { fn <$> ap <*> ap2 };
```

Expression extensions can be used in a do-notation block, and a do-notation block can be the expression of an expression block. Despite this, expression blocks should only be used when you have a single expression you want to use directly from JS code, as nesting them in themeselves or in do-blocks is redundant and parentheses suffice for raising precedence. Do-blocks can be nested as well and should be where appropriate.

### If-Else
Also provided are if-else expressions which replace normal JS conditionals and the ternary operator inside the expression extensions/do-notation. These are expression based like the ternary operator, not statement based like an if-elseif-else in JS. Here is an example:

```js
const a = expr { if (9 < 10) expr1 else expr2 } // a === expr1
```
Note that this implies that if-elseif-else statements cannot be used within do-notation or expression blocks.

### Caveats
The parts of your code that live in a do-notation or expression block will be preprocessed by `monadic-js`. This is essentially source-to-source compilation of a mini-language to JavaScript. This mini-language is designed to embed well in JavaScript, so it provides similar syntax to JavaScript, and for the most part these constructs have the same semantics as they do in JavaScript.

The parser does not handle the entire ES grammar as I did not want to spend the time dealing with all of its intricacies and then eliminate many constructs from being used in the extensions (such as iteration). Instead the parser is built around a grammar for a subset of JavaScript including all of the major operators with the same associativity and precedence levels they normally have, arrow functions with an expression body, destructuring (though I need to add multi-level destructuring, which shouldn't be difficult), and primitive type literals and constructors. Not included are function statements (normal function declarations), arrow functions with a statement block body, classes, loops, generator functions, void, assignment to identifiers (assignment to identifiers is const binding), the ternary conditional operator, computed member access l-value/binding (this will be supported eventually), and bitwise negation (I'm thinking about eliminating the other bitwise operators since >> has already been overloaded).

These choices were made to try to encourage an immutable style and functional programming, but leave room for imperative programming because sometimes it is needed for efficiency.

Click [here](documentation/extensions-grammar.md) to see the full grammar for these extensions, which serves as the main documentation for what can and can't be done in them.

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
If you plan on using this in your project, please read about the [caveats](documentation/parallel.md).

## Parser combinators
Parser combinators are provided that roughly follow the interface of Parsimmon. Unlike Parsimmon, these parsers support memoization of results and use a modification to a not well known enough algorithm to support left-recursion in a top-down parse without grammar knowledge (which can be used to perform automated rewrites of the grammar for parser generators). This allows keeping the modularity of parser combinators and their other benefits (such as generic non-terminals that curry arguments, something that doesn't exist in formal grammar specifications), while supporting left-recursion.

These combinators were used to implement the parser for do-notation and expression blocks.

TODO: Add example

Information on the computational complexity of these parsers can be found [here](documentation/parser-analysis.md)

## ConcurrentFree - DSLs from ADTs
The Free Monad is a somewhat well known construction that allows recovering a Monad from a Functor. It does this by providing a mechanism to lift values of the Functor into values of the Free monad and a mechanism to monadically compose those lifted values. What you get though, is essentially a big nested nested tree whose leaves are values of the functor and whose intermediate nodes represent the monadic composition. To make this useful, you have to transform each of these nodes into another monad.

This sounds a lot like constructing a program and then interpreting it. In fact, this is exactly what the construction is used for -- creating DSLs. The best part is you don't have to worry at all about how a program in the DSL is written, just writing an interpreter for the DSL.

The Free Monad can be generalized in many ways, such as relaxing the restriction that it be over a Functor. We can also add some extensions, such as mixing in the Free Applicative, which is nearly the same thing, but for recovering an Applicative. Combining these approaches carefully we wind up with ConcurrentFree, which is able to recover Functor, Applicative, and Monad from an ADT. This construction allows nesting applicative and monadic composition arbitrarily. Transformations from ConcurrentFree to another Monad preserve the applicative structure until monadic composition (chain/bind) is encountered. Because of this, if the semantics of the Applicative instance for the Monad you transform to are concurrent, then use of applicative composition with ConcurrentFree will be concurrent!

An extension is made to the traditional `foldMap` style interpretation of Free Monads that allows specifying interpreters that perform setup and cleanup operations in the output Monad. This is useful for implementing interpreters that require the creation and disposal of resources (for example, interacting with a database). Interpreters can also be combined, and since this is JavaScript, which lacks a static type system, we can compose operations from different Free Monads with no additional effort.

To sum the process up, you create an ADT and lift your ADT constructors to Free Monad constructors with `ConcurrentFree.liftF`. You create an interpreter that performs any setup and cleanup operations in the output Monad, and which provides a transformation from your ADT to the output Monad. The transformation provides an (informal) operational semantics for your DSL.

### Example of ConcurrentFree
Below is an example of a toy DSL implemented using ConcurrentFree, which demonstrates the preservation of concurrent applicative semantics. An actual effectful library can easily be turned into a DSL this way.

```js
const monadic = require('monadic-js');
const Async = monadic.Async;
const F = monadic.ConcurrentFree;
const {forever, CaseClass} = monadic.Utility;

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
Read the full API documentation [here](documentation/api.md).

## Contributing
Contributions are welcome. Currently just follow the standard fork-commit-push-pull request model. If this gets attention and people want to collaborate I will start an organization for this and we can start coming up with actual guidelines for style and contribution.
