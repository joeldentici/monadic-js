# Monadic JS Documentation

## Modules:
Click a module name below to see its documentation

* [MonadicJS](#monadicjs)
* [MonadicJS.ArrayExtensions](#monadicjs-arrayextensions)
* [MonadicJS.Async](#monadicjs-async)
* [MonadicJS.Async.AsyncComputation](#monadicjs-async-asynccomputation)
* [MonadicJS.Async.AsyncFirst](#monadicjs-async-asyncfirst)
* [MonadicJS.ConcurrentFree](#monadicjs-concurrentfree)
* [MonadicJS.ConcurrentFree.Control](#monadicjs-concurrentfree-control)
* [MonadicJS.Do](#monadicjs-do)
* [MonadicJS.Do.Analyze](#monadicjs-do-analyze)
* [MonadicJS.Do.Generate](#monadicjs-do-generate)
* [MonadicJS.Do.Lexer](#monadicjs-do-lexer)
* [MonadicJS.Do.LexicalGrammar](#monadicjs-do-lexicalgrammar)
* [MonadicJS.Do.ParseDo](#monadicjs-do-parsedo)
* [MonadicJS.Do.Transform](#monadicjs-do-transform)
* [MonadicJS.Do.TransformJS](#monadicjs-do-transformjs)
* [MonadicJS.Either](#monadicjs-either)
* [MonadicJS.Either.Left](#monadicjs-either-left)
* [MonadicJS.Either.Right](#monadicjs-either-right)
* [MonadicJS.FunctionExtensions](#monadicjs-functionextensions)
* [MonadicJS.Maybe](#monadicjs-maybe)
* [MonadicJS.Maybe.Just](#monadicjs-maybe-just)
* [MonadicJS.Maybe.Nothing](#monadicjs-maybe-nothing)
* [MonadicJS.Parser](#monadicjs-parser)
* [MonadicJS.Parser.Parser](#monadicjs-parser-parser)
* [MonadicJS.State](#monadicjs-state)
* [MonadicJS.Utility](#monadicjs-utility)
## MonadicJS
<a name="monadicjs"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

This library provides implementations of common
monads in JavaScript.

Utility functions for working with monads abstractly are also
provided, as well as a generator-based do-notation utility.
## MonadicJS.ArrayExtensions
<a name="monadicjs-arrayextensions"></a>
**Written By:** Joel Dentici

**Written On:** 7/19/2017

Makes Array compatible with this library.

WARNING: This modifies the Array prototype
so you should always unload it when done. You
may still mess other code up if you use these
extensions in an asynchronous section of code.
## MonadicJS.Async
<a name="monadicjs-async"></a>
**Written By:** Joel Dentici

**Written On:** 6/25/2017

The Async monad represents computations
that run in an asynchronous context.

Unlike Promises, an Async computation is
lazily evaluated, so it won't be executed
immediately. Asyncs can be turned into Promises
by calling "run" on them and Promises can be turned
into Asyncs by applying Async.fromPromise to them
#### all :: ...Async c e a &#8594; Async c e [a]

Returns an Async computation whose result
combines all the results from the provided
Asyncs.

If any of the Asyncs fail, then the resulting
Async will have its error.

This can be called with an array or rest args.

There must be at least one computation provided,
regardless of how this is called.
#### await :: Promise a e &#8594; Async (Promise a e) e a

This basically just maps Promises into
Asyncs.
#### create :: ((a &#8594; ()) &#8594; (e &#8594; ()) &#8594; c) &#8594; Async c e a

Creates an Async computation. Takes a function that
accepts two functions, one for a successful computation
an one for a failed computation. This function is not
executed until the Async is ran.
#### fail :: e &#8594; Async () e ()

Returns an Async computation that failed
for the specified reason.
#### first :: ...Async c e a &#8594; Async c e a

Returns an Async computation whose result is
the result of the first provided computation to
finish.
#### fork :: (Async c b a, (a &#8594; d), (b &#8594; e)) &#8594; c

Runs the asynchronous computation. Its result
will be passed to succ or fail as appropriate.
#### fromEither :: Either e a &#8594; Async () e a

Creates an Async computation whose result or failure
is the value in the specified Either.
#### fromMaybe :: Maybe a &#8594; Async () NonExistenceError a

Creates an Async computation whose result is the
value in the Maybe. If the Maybe is Nothing, then
the Async computation will result in a NonExistenceError.
#### fromPromise :: Promise a e &#8594; Async (Promise a e) e a

Alias of await
#### of :: a &#8594; Async () () a

Alias for unit. Provided for fantasy-land
compliance.
#### parallel :: WebWorker &#8594; ((a_0..a_n) &#8594; b) &#8594; (a_0..a_n) &#8594; Async () Error b

Allows running functions in a fully parallel context.

Functions cannot be curried! If you try to use a curried
function with this, the result will be a CurryingError.
If you pass in a function that has already been curried,
you will get a ReferenceError on its curried arguments.
This is because the function is serialized to source and
passed to the worker for execution. Serializing a curried
function does not carry its environment, so it will have
free variables in its body.

Applying parallel to a WebWorker implementation returns
a function that can be used to wrap functions to run
on another thread/process and return their results in
an Async.

Note that you can achieve concurrency with CPU-bound
computations by just using Async computations -- All
you need to do is break them up into chains where you
return results with Async.of or even just by chaining
map from an initial Async.of() and turn iteration into
recursion (you can also write most loops as higher order
functions but that is inelegant). This works, but it isn't
truly parallel as it doesn't utilize multiple CPU cores. It
is essentially just time-sharing of coroutines (which can be
faster than threads or processes for simple tasks).

Using this will give you truly parallel computation.
#### run :: Async c e a &#8594; ()

Runs the asynchronous computation, discarding
the result.
#### sleep :: int &#8594; Async int () ()

Creates an Async computation that sleeps for the specified
timespan in milliseconds and returns no result.
#### throwE :: e &#8594; Async () e ()

Alias of fail
#### toPromise :: Async c e a &#8594; Promise a e

Forks the computation and returns a promise
for its result.
#### try :: Async c e a &#8594; Async c e a

This method literally doesn't do anything. It is just
here to make catching look more imperative by surrounding
it with try.
#### unit :: a &#8594; Async () () a

Puts a value into the context of
an Async computation.
#### wrap :: ((...any, e &#8594; a &#8594; ()) &#8594; c) &#8594; ...any &#8594; Async c e a

Wraps a callback taking async function so it becomes a function
that returns Async computations.
#### wrapPromise :: (...any &#8594; Promise a e) &#8594; ...any &#8594; Async (Promise a e) e a

Wraps a promise returning async function so it becomes a function
that returns Async computations.
## MonadicJS.Async.AsyncComputation
<a name="monadicjs-async-asynccomputation"></a>
**Written By:** Joel Dentici

**Written On:** 6/25/2017

Holds a thunked computation.
#### alt :: Async c e a &#8594; Async c e b &#8594; Async c e (a | b)

Alternative sequencing. The computation on the left is
ran and if it is successful, its result is used. If it
fails, then the computation on the right is ran and its
result is used.
#### ap :: Async c e a &#8594; Async c e (a &#8594; b) &#8594; Async c e b

Flipped arguments for app. This is for fantasy-land, but
probably isn't very useful as it breaks chaining.
#### app :: Async c e (a &#8594; b) &#8594; Async c e a &#8594; Async c e b

Applicative application. Applies the function result of
this Async computation to the result of the specified Async
computation. If used with an n-ary curried function, then
app can be chained n times to fully apply it.

This is written such that chained applications will run
the computations concurrently.
#### bind :: Async c e a &#8594; (a &#8594; Async c e b) &#8594; Async c e b

Alias for chain.
#### catch :: Async c e a &#8594; (e &#8594; Async c e2 b) &#8594; Async c e2 b

Alias for chainFail.
#### chain :: Async c e a &#8594; (a &#8594; Async c e2 b) &#8594; Async c e2 b

Monadic binding of Async computations. The computations
run sequentially. Failed computations do not get piped
through.
#### chainFail :: Async c e a &#8594; (e &#8594; Async c e2 b) &#8594; Async c e2 b

Same as chain/bind but the function is applied when this
computation fails.
#### chainIt :: ((b &#8594; ()), (e &#8594; ()), (a &#8594; Async () e a)) &#8594; (a &#8594; ())

Performs the monadic chaining while catching any errors that occur.
#### doCase :: Async c e a &#8594; (((a &#8594; (), e &#8594; ()) &#8594; c) &#8594; b) &#8594; b

Applies the function to the thunked computation.
#### fork :: Async c e a &#8594; (a &#8594; (), e &#8594; ()) &#8594; ()

Runs the Async computation. The success or fail
function is applied to its result, depending on
whether it is successful or not.
#### later :: (a &#8594; b) &#8594; a &#8594; ()

Wraps the application to the specified function
in an application of the immediate function.
#### map :: Async c e a &#8594; (a &#8594; b) &#8594; Async c e b

Applies the function to the result of this computation.
#### mapCatch :: Async c e a &#8594; (e &#8594; e2) &#8594; Async c e2 a

Applies the function to the error of this computation.
#### mapIt :: ((b &#8594; ()), (e &#8594; ()), (a &#8594; b)) &#8594; (a &#8594; ())

Returns a new function that applies fn to whatever value
it gets and then applies cont to that. If an error occurs
in fn, then we will catch it and fail with it.

Note: This allows breaking out of the monadic control flow
by throwing in a map, but it is very important that we don't
bring down an entire application by one Async computation having
an error in it.
#### new :: ((a &#8594; (), e &#8594; ()) &#8594; c) &#8594; Async c e a

Creates an Async computation from the provided thunked
computation, which will be called with callbacks for a result
or error when the Async computation is forked/ran.
#### run :: Async c e a &#8594; ()

Forks the computation and throws away the results.

Useful for when you were using the Async results to
do side effects that could throw errors in a tap
and wanted to catch them using chainFail/catch.
#### seqL :: Async c e a &#8594; Async c e b &#8594; Async c e a

Sequences Async computations, keeping the value of
the one on the left. The computations are ran concurrently.
#### seqR :: Async c e a &#8594; Async c e b &#8594; Async c e b

Sequence Async computations, keeping the value of
the one on the right. The computations are ran concurrently.
#### tap :: Async c e a &#8594; (a &#8594; ()) &#8594; Async c e a

Tap into the Async computation at a certain point
to perform a side effect. This should be used with
care and mainly only by the consumer of an Async computation.
#### tapFail :: Async c e a &#8594; (e &#8594; ()) &#8594; Async c e a

Tap for failures.
#### toPromise :: Async c e a &#8594; Promise a e

This is the same as forking the computation, but
you get back a Promise for the result.
## MonadicJS.Async.AsyncFirst
<a name="monadicjs-async-asyncfirst"></a>
**Written By:** Joel Dentici

**Written On:** 6/25/2017

Holds a set of AsyncComputations.
#### fork :: AsyncFirst e a &#8594; (a &#8594; b, e &#8594; c) &#8594; b | c

This overrides the AsyncComputation fork to fork all
the Async computations and keep the result of whatever
finishes first.
#### new :: [Async c e a] &#8594; Async c e a

Constructs an AsyncFirst
## MonadicJS.ConcurrentFree
<a name="monadicjs-concurrentfree"></a>
**Written By:** Joel Dentici

**Written On:** 7/19/2017

Free monads over any algebraic data type
that preserve concurrent semantics of Applicative
and Functor during interpretation.
#### alt :: Free f a &#8594; Free f b &#8594; Free f (a | b)

Alternative composition. During interpretation, we
attempt to interpret this Free Monad. If that results
in an error, we interpret the specified Free Monad instead.

You must include Control.interpreter in your interpreter
list to use this, or you will get an error at runtime.
#### ap :: Free f a &#8594; Free f (a &#8594; b) &#8594; Free f b

Reversed arguments of app.
#### app :: Free f (a &#8594; b) &#8594; Free f a &#8594; Free f b

Applicative application of a function in a
Free monad to a value in a Free monad.
#### chain :: Free f a &#8594; (a &#8594; Free f b) &#8594; Free f b

Monadic chaining/binding of a value in a Free
monad to a function that returns a Free monad.
#### combineTransformations :: Monad m &#8658; forall a. [f a &#8594; m (m a)] &#8594; (f a &#8594; m (m a))

Combines a list of transformations into a single transformation.

In order for this to work, each transformation must return an undefined
result for any (f a) it cannot handle. This is easily accomplished with
default: constant(undefined) or default: _ => undefined or default: _ => {}
in the type case analysis.

If no transformation exists for a value, then an InterpreterError is thrown.
#### empty :: Free f ()

A Free Monad with no value. Uses the control
primitive throwE to ensure that chained functions
will not be applied, thus satsifying <code>empty >>= f = empty</code>.
#### foldConcurrent :: Monad m &#8658; Free f a &#8594; (Type m, (forall x. f x &#8594; m (m x))) &#8594; m a

Interpret this Free monad into the specified monad
using the specified transformation.
#### foldConcurrent :: Monad m &#8658; Type m &#8594; (forall x. f x &#8594; m (m x)) &#8594; Free f a &#8594; m a

Interpret a Free monad over f using a transformation from
f to m m, where m is the monad we are interpreting into.
#### interpret :: MonadFail m, All m &#8658; (Type m, ...Interpreter) &#8594; Free f a &#8594; m e a

Interprets a Free monad using multiple interpreters, typically
one for each ADT that is summed into f, into the specified
monad.

Each interpreter can run setup and cleanup actions. Two cleanup methods
are required: one for a normal case and one for an error case. If either
cleanup method itself fails, then the error for that is returned. If only
the transformation fails, then the error for that is returned.

The monad being interpreted into must be a MonadFail and All, meaning it
should provide a fail method for errors, a chainFail method to catch errors,
and an all method to sequence a list of actions.
#### Interpreter :: Object

An Interpreter is an object satsifying the following interface:

<code>.setup :: MonadFail m => () -> m e ()</code> Perform actions prior to interpretation

<code>.transform :: MonadFail m => (f x, f x -> m e x) -> m e x</code> Transform an ADT to a monadic action.
The second argument to transform contains all transformations and can be used with foldConcurrent to interpret
"sub-statements".

<code>.cleanupSuccess :: MonadFail m => x -> m e ()</code> Perform cleanup after successful interpretation

<code>.cleanupFail :: MonadFail => e -> m (e | e2) ()</code> Performs cleanup after failed interpretation

This is the preferred interface, instead of just providing a transformation.
#### liftF :: f a &#8594; Free f a

Put a value in f context into
a Free f context
#### map :: Free f a &#8594; (a &#8594; b) &#8594; Free f b

Maps a function over the value in the
Free monad.
#### of :: a &#8594; Free f a

Put a pure value into Free f context
#### seqL :: Free f a &#8594; Free f b &#8594; Free f a

Applicative sequencing from left-to-right,
keeping the left value.
#### seqR :: Free f a &#8594; Free f b &#8594; Free f b

Applicative sequencing from left-to-right,
keeping the right value.
#### zero :: () &#8594; Free f ()

Returns Free.empty
## MonadicJS.ConcurrentFree.Control
<a name="monadicjs-concurrentfree-control"></a>
**Written By:** Joel Dentici

**Written On:** 7/20/2017

Provides control flow primitives for Free monads
that require access to execution.

Note that this is what gives ConcurrentFree its Alternative
instance, so you must include it in your interpreter list to use
Alternative composition with ConcurrentFree.
#### catch e a :: Object

A catch is an object providing a catch method
that accepts a handler for errors.

<code>catch :: () -> (e -> Free Control a) -> Free Control a</code>

You don't need to supply your own catch. It is what is
returned by applying tryF. You supply a handler to that
catch. This is purely so try-catch looks like normal JS.
#### fromAsync :: Async c e a &#8594; Free Control a

Useful if you will be interpreting to Async.

When interpreted into an Async, it just spits out
the Async it is holding
#### fromPromise :: Promise e a &#8594; Free Control a

Wraps the promise in an Async and then applies
fromAsync to that.
#### throwE :: e &#8594; Free Control ()

Throws an error.
#### tryF :: Free f a &#8594; catch e b &#8594; Free Control (a | b)

Applying tryF to a Free Monad value will return
a catch that accepts a handler for the errors that
may be generated by interpreting that Free Monad value.

The result of applying the catch to a handler is a Free Monad
whose result type is either the type of this Free Monad or the
type of the Free Monad returned by the handler.

Returning a catch is purely so that this looks like normal JS.
## MonadicJS.Do
<a name="monadicjs-do"></a>
**Written By:** Joel Dentici

**Written On:** 6/30/2017

Provides ability to use do notation without
relying on generators. This leads to fancier
code and the ability to use monads that apply
their bound function more than once, like list.

This module provides a function that can be called
to install a hook into the node module loader, which
will cause any later require() calls to have their
module's source processed through this module. The
transforming function itself is exported so you can
write a simple source-to-source compiler if you prefer that.
#### loadDo :: (string, bool) &#8594; ()

Hooks into the node module loader and registers the
specified extension to be pre-compiled by the do-notation
transformer.

The default extension used when none is specified is '.ejs'

The second argument can be used to get verbose output from
this function:
Level 0 - Errors only
Level 1 - Level 0 + Loading messages & compilation time
Level 2 - Level 1 + Compilation output
## MonadicJS.Do.Analyze
<a name="monadicjs-do-analyze"></a>
**Written By:** Joel Dentici

**Written On:** 7/10/2017

Performs analysis on do notation blocks
in an AST, looking for pieces that can be
optimized to use applicative, rather than
monadic, application and sequencing.

The resulting AST has nodes that can be used
in applicative style marked as such.
#### analyze :: AST &#8594; AST

Performs analysis on the provided AST.

TODO: Implement this.
## MonadicJS.Do.Generate
<a name="monadicjs-do-generate"></a>
**Written By:** Joel Dentici

**Written On:** 7/10/2017

Generates JavaScript output from a
Transformed AST.
#### generate :: AST &#8594; string

Maps the AST to a string by traversing it
and mapping each node that is encountered to a string.
## MonadicJS.Do.Lexer
<a name="monadicjs-do-lexer"></a>
**Written By:** Joel Dentici

**Written On:** 7/1/2017

This module performs lexical analysis on an
input string according to a provided lexical
grammar.
## MonadicJS.Do.LexicalGrammar
<a name="monadicjs-do-lexicalgrammar"></a>
**Written By:** Joel Dentici

**Written On:** 7/1/2017

This module defines the lexical grammar (parts of
the CFG that can be recognized by regular expressions)
for a subset of JavaScript's lexical gramar.
## MonadicJS.Do.ParseDo
<a name="monadicjs-do-parsedo"></a>
**Written By:** Joel Dentici

**Written On:** 7/10/2017

This module defines the parser for
do notation and expression blocks.

This should be used in conjunction with
the lexer module and the provided lexical grammar.
#### infixLeft :: (Parser Token string, Parser Token AST) &#8594; Parser Token AST

Creates a parser for an infix operator(s) that is
left associative.
#### infixRight :: (Parser Token string, Parser Token AST) &#8594; Parser Token AST

Creates a parser for an infix operator(s) that is
right associative.
#### operators :: Map string (Parser Token any) &#8594; Parser Token string

Creates a single parser from a map from operator
names to operator parsers. Each parser in the map
is made to yield its name as its result.
#### postfix :: (Parser Token string, Parser Token AST) &#8594; Parser Token AST

Creates a parser for a postfix operator(s).
#### prefix :: (Parser Token string, Parser Token AST) &#8594; Parser Token AST

Creates a parser for a prefix operator(s).
#### topLevel :: (a, Parser Token AST) &#8594; Parser Token BinaryExpression

Creates a parser for the top level precedence operators
in JavaScript. These are the member access and function application
which both have weird syntax compared to other operators.
## MonadicJS.Do.Transform
<a name="monadicjs-do-transform"></a>
**Written By:** Joel Dentici

**Written On:** 7/10/2017

Provides a function to replace do-blocks,
if-blocks, and other specialized syntax (non-js 
operators) with valid js syntax.
#### transform :: (AST, string) &#8594; AST

Transforms the AST in the manner described
above.
#### transformBinaryExpr :: string &#8594; (string, AST, AST) &#8594; AST

Transforms the binary expression. If its operator is one
of those in exprOps, then we transform it to the appropriate
function application
#### transformDoBlock :: (string, [AST]) &#8594; AST
#### transformUnaryExpr :: string &#8594; (string, AST) &#8594; AST

Transforms return expressions to applications of
the current monad's "of" function. If we are not
in a do-block, then the return is left as is and
will become a statement in the output JS.

All other unary operator expressions are returned
unchanged.
## MonadicJS.Do.TransformJS
<a name="monadicjs-do-transformjs"></a>
**Written By:** Joel Dentici

**Written On:** 7/10/2017

This module provides a function to transform
JavaScript source that contains do and expr
blocks to an equivalent one with those blocks
mapped to actual JavaScript syntax.

This relies on lexing the source, scanning until
a block is found, emitting tokens that are not
part of a block immediately to the output buffer.

Once a block is found, we begin parsing at the current
input position. The AST of the parsed block is then
analyzed and transformed to get a new AST with only
JavaScript syntax. That AST is finally mapped back to 
JavaScript source code by the generator.

After a block has been fully transformed, we begin
scanning and immediate re-emitting until we find another
block.

The resulting output buffers are concatenated and returned.
#### isDo :: ([Token], int) &#8594; bool

Checks if we are at a possible do block.
#### isExpr :: ([Token], int) &#8594; bool

Checks if we are at a possible expr block.
#### isX :: ([Token], int, string, string) &#8594; bool

Checks if the current position is the beginning
of some type of phrase.
#### transformJS :: string &#8594; Either string string

Transforms the input source code in the manner
described above.

If an error occurs while parsing a do-block or
expr block, then it will be returned after being
formatted into a readable string. Otherwise,
the resulting source code is returned. The first
error to occur will stop any further transformation.
## MonadicJS.Either
<a name="monadicjs-either"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

Defines the Either monad.
#### unit/of :: a &#8594; Right a

Puts a value into Either context.
## MonadicJS.Either.Left
<a name="monadicjs-either-left"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

The Left constructor
#### bind :: Left c &#8594; (a &#8594; Either c b) &#8594; Left c

Doesn't apply the function per Either semantics.
#### chain :: Left c &#8594; (a &#8594; Either c b) &#8594; Left c

Alias for bind. Provided for fantasy-land compliance.
#### doCase :: Left a &#8594; (a &#8594; b) &#8594; b

Applies the function to the value in the
Left
#### map :: Left c &#8594; (a &#8594; b) &#8594; Left c

Doesn't apply the function per Either semantics.
#### new :: a &#8594; Left a

Construct a Left
## MonadicJS.Either.Right
<a name="monadicjs-either-right"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

The Right constructor
#### bind :: Right a &#8594; (a &#8594; Either c b) &#8594; Either c b

Apply the function to the value contained
in this Right.
#### chain :: Right a &#8594; (a &#8594; Either c b) &#8594; Either c b

Alias for bind. Provided for fantasy-land compliance.
#### doCase :: Right a &#8594; (a &#8594; b) &#8594; b

Apply the function to the value contained
in this Right.
#### map :: Right a &#8594; (a &#8594; b) &#8594; Right b

Apply the function to the value contained
in this Right.
#### new :: a &#8594; Right a

Construct a Right
## MonadicJS.FunctionExtensions
<a name="monadicjs-functionextensions"></a>
**Written By:** Joel Dentici

**Written On:** 7/19/2017

Makes Function compatible with this library.

WARNING: This modifies the Function prototype
so you should always unload it when done. You
may still mess other code up if you use these
extensions in an asynchronous section of code.

NOTE: Using the do-notation/expr language extension
will automatically load these extensions. That is because
they include kleisi composition, which it provides an operator
for.
#### alt :: Alternative f &#8658; (a &#8594; f b) &#8594; (a &#8594; f c) &#8594; a &#8594; f (b | c)

This lifts the alternative combinator for an Alternative to
work on alternative returning functions. Note that this will
always evaluate both functions to use the alternative instance
of their return values. As long as your alternative is side-effect
free, this won't cause any problems. If it is not and those side-effects
are critical (ie, not console.logs or something similar), you might
wind up with corrupt data somewhere.
#### arrow :: Monad m &#8658; (a &#8594; m b) &#8594; (b &#8594; m c) &#8594; a &#8594; m c

Left-to-right Kleisi composition of monadic functions.
#### chain :: (a &#8594; b) &#8594; (b &#8594; (a &#8594; c)) &#8594; a &#8594; c
#### map :: (a &#8594; b) &#8594; (b &#8594; c) &#8594; a &#8594; c

Sequencing of functions.

The Haskell definition is composition of functions
but we define map with its arguments backwards for
all our Functors so it can live on the object, which
means out map = flip haskellmap = sequence
## MonadicJS.Maybe
<a name="monadicjs-maybe"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

Defines the Maybe monad.
#### nullable :: a &#8594; Maybe a

Puts a value into Maybe context. If it
is null or undefined, Nothing is returned.
#### unit/of :: a &#8594; Just a

Puts a value into Maybe context.
## MonadicJS.Maybe.Just
<a name="monadicjs-maybe-just"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

The Just constructor
#### bind :: Just a &#8594; (a &#8594; Maybe b) &#8594; Maybe b

Apply the function to the value contained
in this Just.
#### chain :: Just a &#8594; (a &#8594; Maybe b) &#8594; Maybe b

Alias for bind. Provided for fantasy-land compliance.
#### doCase :: Just a &#8594; (a &#8594; b) &#8594; b

Apply the function to the value contained
in this Just.
#### map :: Just a &#8594; (a &#8594; b) &#8594; Just b

Apply the function to the value contained
in this Just.
#### new :: a &#8594; Just a

Construct a Just
## MonadicJS.Maybe.Nothing
<a name="monadicjs-maybe-nothing"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

The Nothing type
#### bind :: Nothing &#8594; (a &#8594; Maybe b) &#8594; Nothing

Doesn't apply the function per Maybe semantics.
#### chain :: Nothing &#8594; (a &#8594; Maybe b) &#8594; Nothing

Alias for bind. Provided for fantasy-land compliance.
#### doCase :: Nothing &#8594; (() &#8594; b) &#8594; b

Applies the function
#### map :: Nothing &#8594; (a &#8594; b) &#8594; Nothing

Doesn't apply the function per Maybe semantics.
## MonadicJS.Parser
<a name="monadicjs-parser"></a>
**Written By:** Joel Dentici

**Written On:** 7/3/2017

Applicative Parser combinators for JavaScript.

The parsers are LL() and uses a modified version of the parsing algorithm
given by Frost, Hafiz, and Callaghan to handle left recursion
and provide memoization of parse results. This is an LL parser, unlike the
parser they give so it only returns the left-most parse (derivation) according
to the grammar it is parsing.

These parsers do not require a separate lexical analysis step, but their
performance can be improved by using one. The combinators can be used to perfrom
this lexical analysis step, but it will probably be more efficient to write
a procedure specific to this.

It implements the following Fantasyland algebras:
	Functor
	Apply
	Applicative
	Alt
	Plus
	Alternative
	Chain
	Monad

We also alias our names for the operations of the
above algebras, as well as providing aliases for
names specific to parsing.

The names for some operations were taken from Parsimmon.
#### runParser :: (Parser t a, bool?) &#8594; ([t], int?) &#8594; Either ParseError (ParseResult a)

Runs the provided parser on the provided input. Either
a ParseError or ParseResult a is returned depending on
whether the parser failed or succeeded. Both contain the position
in the input last parsed. ParseError additionally contains an
Error and ParseResult contains a value of type a.
## MonadicJS.Parser.Parser
<a name="monadicjs-parser-parser"></a>
**Written By:** Joel Dentici

**Written On:** 7/5/2017

Parser type. Implements applicative,
alternative, functor, and monad algebras.

Parsers automatically detect and fail
left recursion infinite descent of a parser, so that
other parsers can be tried.

Parsers can be memoized. This
increases parsing efficiency for grammars
where backtracking is necessary (ie ambiguous grammars).
#### all :: Parser t [t]

A parser that will consume any remaining input.

It is not an error to already be at the end of the input,
but an empty result will be returned if this is the case.
#### alt :: Parser t a &#8594; Parser t b &#8594; Parser t (a | b)

Alternative Applicative Functor choice application

Returns a parser that:

Applies this parser first. If it fails, then
the provided parser is applied. The result of
the last applied parser is returned.
#### any :: Parser t t

A parser that will consume the next token of input
and return it as its result, no matter what it is.

If there is no input left, then an error is returned.
#### ap :: Parser t a &#8594; Parser t (a &#8594; b) &#8594; Parser t b

Applicative functor application, conforming to the
fantasy-land spec.

Unfortunately, the fantasy-land spec has the parameters
backwards from the Haskell function, which makes applicative
application unnatural. Use app for a more natural applicative
interface.
#### app :: Parser t (a &#8594; b) &#8594; Parser t a &#8594; Parser t b

Applicative Functor application

Returns a parser that:

Applies a function in parser context to the
result of a parser. If the function is curried
and has more arguments, then ap can be changed.
#### bind :: Parser t a &#8594; (a &#8594; Parser t b) &#8594; Parser t b

Monadic bind

Returns a parser that:

First applies this parser to get a result. If
successful, the provided function is applied
to the result to get a new parser. That parser
is then applied to get the result.

You should use the applicative interface
in cases where you don't need to make context-sensitive
decisions. Obviously if context is required to parse,
the monadic interface must be used as it is the only
combinator that allows decisions to be made at runtime.
#### canReuse :: LeftRecContext &#8594; LeftRecContext &#8594; bool

Checks whether a result can be reused in the current
parsing context.
#### chain :: Parser t a &#8594; (a &#8594; Parser t b) &#8594; Parser t b

Alias for bind. Provided for fantasy-land compliance.
#### cons :: a &#8594; [a] &#8594; [a]

Contructs a list from a head element
and a tail list.
#### empty :: Parser t ()

A parser with no result. This parser always succeeds
without consuming any input.
#### eof :: Parser t ()

A parser that expects to see the end of input.

If EOF has been reached, then an empty result is returned,
otherwise an error is returned.
#### fail :: Error &#8594; Parser t ()

Returns a parser that always fails with
the provided error.
#### Fail :: int &#8594; Error &#8594; ParseError

See ParseError. Applies ParseError to p, e and then
wraps the return value in an Either context.
#### fallback :: Parser t a &#8594; b &#8594; Parser t (a | b)

Returns a parser that first tries this parser,
but always returns the provided value when this
parser fails.

Equivalent to this.alt(Parser.of(value))
#### findToken :: (t &#8594; bool) &#8594; string &#8594; Parser t t

Returns a parser that consumes input until it matches
an input token with the provided predicate. If no match
occurs, then an error is raised.

This is useful in conjunction with lookahead when
parsing input that has been lexed. For raw input, regex
is probably more useful.
#### getlrec :: LefRecContext &#8594; int &#8594; int &#8594; LeftRecContext

Returns the LeftRecContext that should be used:

If the oldPos is not the newPos (in other words,
the prior parser consumed input), then the LeftRecContext
should be reset, otherwise the same one is passed down.
#### lookahead :: Parser t a &#8594; Parser t bool

Returns a parser that will check if the
provided parser matches the upcoming input.

If it does, true is returned, otherwise false
is returned. The resulting parser does not
consume input.
#### lookup :: Parser t a &#8594; int &#8594; LeftRecContext &#8594; Map (Parser t a) (Map int (Either ParseError [(ParseResult a), LeftRecContext])) &#8594; ParseResult a | null

Tries to find a valid result in the memoization table for the provided
parser.
#### many :: Parser t a &#8594; Parser t [a]

Alternative Applicative Functor many

Returns a parser that:

Applies this parser zero or more times
to get a list of the results that this
parser returns.
#### map :: Parser t a &#8594; (a &#8594; b) &#8594; Parser t b

Functor map

Returns a parser that:

Applies this parser to the input. If it succeeds,
the provided function is applied to its result
and the result of that application is returned.
#### memoize :: Parser t a &#8594; bool? &#8594; any? &#8594; Parser t a

Returns an equivalent parser that memoizes
results, up to curtailment of left recursion.

This should generally be applied to non-terminals.
Applying it too liberally can actually cause worse
performance.

The optional boolean argument tells memoize whether
the original parser is even or odd (based on how
many parsers it chains together, only at the top
level). This is used to give the correct left-most
parse when left-recursion occurs because it lets us
avoid an off-by-one error when we attribute curtailment
too deep by assuming an even parity.

The optional name argument allows you to provide the
value that will be used in internal maps and sets. Absent
it, the parser itself will be used. It may be possible to
get better performance by using an integer, for example than
an object.
#### mergeUps :: int &#8594; int &#8594; Set a &#8594; Set a &#8594; Set a

Merges the provided up contexts (sets of parsers
that led to curtailment due to left recursion):

If oldP is not the newP (some input was consumed
in the second parser), then the first context is
returned. Otherwise, the contexts are merged.
#### new :: ([t] &#8594; int &#8594; LeftRecContext &#8594; State ParseState (Either ParserError (ParseResult a))) &#8594; Parser t a

Constructs a parser from the provided function.
#### of/unit :: a &#8594; Parser t a

Returns a parser whose result is the value
provided (always). This parser always succeeds
without consuming any input.
#### or :: Parser t a &#8594; Parser t b &#8594; Parser t (a | b)

Alias for alt. Provided as the name is more meaningful
in the domain of parsing.
#### ParseError :: int &#8594; Error &#8594; ParseError

Returns a ParseError, representing a parse
that failed after consuming tokens up to (p - 1)
with the provided error.
#### Parser :: ([t] &#8594; int &#8594; LeftRecContext &#8594; State ParseState (Either ParserError (ParseResult a))) &#8594; Parser t a

Constructs a Parser from the provided function.
#### ParseResult :: int &#8594; a &#8594; ParseResult a

Returns a ParseResult, representing a parse
that has consumed tokens up to (p - 1) and
has yielded the value x.
#### pruneContext :: Set (Parser t any) &#8594; Map (Parser t any) int &#8594; Map (Parser t any) int

Removes entries from the provided LeftRecContext that do not appear
in the cutailment set.
#### recursive :: (() &#8594; Parser t a) &#8594; Parser t a

Creates a Parser that applies the provided
function the first time the parser is used to get
a parser to parse with. That parser is then used
to parse the current and all subsequent inputs when
the returned parser is used.

This allows the construction of recursive grammars,
so that parsers can refer to ones that have not
yet been defined.
#### regexTerm :: RegExp &#8594; string &#8594; Parser string [string]

Recognizes strings in the input matching
the provided regular expression. The result
when successful is a list of matches, which
is what is returned by the JavaScript string
match function.

Aliases: regex
#### result :: Parser t a &#8594; b &#8594; Parser t b

Returns a parser that runs this parser first,
but always maps its result to the provided value.

Useful with stringTerm parsers that only recognize
a single value, but you may want a static, semantically
meaningful result.
#### runParser :: Parser t a &#8594; [t] &#8594; int &#8594; LeftRecContext &#8594; State ParseState (Either ParseError (ParseResult a))

Runs the parser on the provided input, at the provided position, given
the provided LeftRecContext (left recursion depth map).

Returns a State monad value that can be applied to the current (including initial)
ParseState to get the parser's result.

Note: This is used internally. Use Parser.runParser to run the outermost parser for
your grammar. Doing so will also run the State monad, allowing you to inspect the results.
#### sepBy :: Parser t a &#8594; Parser t b &#8594; Parser t [a]

Returns a parser that tries to repeat applications
of this parser, separated by applications of the
provided parser.

This is equivalent to looking for this parser
followed by the provided parser or the empty parser
an [0, infinity) (many) number of times.
#### sepByPlus :: Parser t a &#8594; Parser t b &#8594; Parser t [a]

Same as sepBy, but expects this parser to match
at least once. Essentially the same as the distinction
between some and many.
#### seqL :: Parser t a &#8594; Parser t b &#8594; Parser t a

Applicative Functor sequential application

Returns a parser that:

First applies this parser, then the provided
parser, dropping the result of the provided parser.
#### seqR :: Parser t a &#8594; Parser t b &#8594; Parser t b

Applicative Functor sequential application

Returns a parser that:

First applies this parser, then the provided
parser, dropping the result of this parser.
#### showError :: ParseError &#8594; ([t], int) &#8594; string

Returns a formatted error message from the provided
error.

The input to the parser should be provided, along with
a context value that determines how much input around the
position where the error ocurred should be shown.
#### skip :: Parser t a &#8594; Parser t b &#8594; Parser t a

Alias for seqL. Provided as the name is more
meaningful in the domain of parsing.
#### some :: Parser t a &#8594; Parser t [a]

Alternative Applicative Functor some

Returns a parser that:

Applies this parser at least once to
get a list of the results that this parser
returns.
#### stringTerm :: string &#8594; Parser string string

Recognizes the provided term.

Can be thought of as a CFG terminal.

Aliases: term
#### Succeed :: int &#8594; a &#8594; Either ParseError (ParseResult a)

See ParseResult. Applies ParseResult to p, x and then
wraps the return value in an Either context.
#### then :: Parser t a &#8594; Parser t b &#8594; Parser t b

Alias for seqR. Provided as the name is more
meaningful in the domain of parsing.
#### tokenTerm :: (t &#8594; bool) &#8594; Parser t t

Recognizes tokens in the input which the
provided predicate returns true for. The
matching token is returned when successful.

This is useful when you perform lexical analysis
separately from parsing, as you cannot use the
string or regex terminal parsers on tokens (obviously).

Aliases: token
#### trim :: Parser t a &#8594; Parser t b &#8594; Parser t a

Returns a parser that applies (around, this, around) in sequence,
keeping the results of this.

Equivalent to this.wrap(around, around) or around.seqR(this).seqL(around).
#### wrap :: Parser t a &#8594; Parser t b &#8594; Parser t c &#8594; Parser t a

Returns a parser that applies (prev, this, next) in sequence,
keeping the results of this.

Equivalent to prev.seqR(this).seqL(next)
#### zero :: () &#8594; Parser t ()

Constant function returning the empty parser.

Exists for fantasy-land compatability.
## MonadicJS.State
<a name="monadicjs-state"></a>
**Written By:** Joel Dentici

**Written On:** 7/3/2017

The State monad.
#### bind :: State s a &#8594; (a &#8594; State s b) &#8594; State s b

Monadic bind. The result, when ran, will apply
the function in this State to the provided state
to get a result and updated state. The provided function
is applied to the result to get a new State and the function
in the resulting State is applied to the updated state.

Thus, the state is threaded through to the provided function
as well as the value.
#### chain :: State s a &#8594; (a &#8594; State s b) &#8594; State s b

Alias for bind. Used for fantasy-land compliance.
#### get :: State s s

Returns a new State whose computation
returns the provided state as its value,
and leaves the state unchanged.
#### map :: State s a &#8594; (a &#8594; b) &#8594; State s b

Functor map for State.

Maps the function over this state by applying
the provided function to the value inside
this state, without affecting the current
state.
#### modify :: (s &#8594; s) &#8594; State s ()

Returns a new State whose computation
applies the provided transformation to
the current state and returns that as
the new state.
#### new :: (s &#8594; [t, s]) &#8594; State s t

Constructs a new State_ value.
#### put :: s &#8594; State s ()

Returns a new State whose computation
replaces the current state with the
state provided to put.
#### runState :: State s t &#8594; s &#8594; [t, s]

Runs the state monad with the provided
state.
#### State :: (s &#8594; [a, s]) &#8594; State s a

Constructs a State from a state threading
computation.
#### unit/of :: a &#8594; State s a

Puts a value into a stateful context.

Does not change the state.
## MonadicJS.Utility
<a name="monadicjs-utility"></a>
**Written By:** Joel Dentici

**Written On:** 6/20/2017

Utility functions for working with monads, applicatives,
alternatives, and just functional stuff in general.
#### all :: Applicative f &#8658; (Type f, [f a]) &#8594; f [a]

Collects the results of a list of applicative
actions into a list. This is more efficient than
mapM (Type f, id), because it uses array push on
the result list rather than creating intermediate arrays.
#### constant :: a &#8594; () &#8594; a

When applied to a value, returns a function
that will always return that value, regardless
of what it is applied to.
#### doM :: Monad m &#8658; (() &#8594; Iterator) &#8594; m a

Do notation helper for monads. Taken from:
https://curiosity-driven.org/monads-in-javascript

Example Usage:
<pre>
const result = doM(function() {
const fst = yield Either.right(5);
const snd = yield Either.right(11);
return Either.unit(fst + snd);
});
</pre>

Note: It is recommended that you use the
do-notation language extension provided,
instead of this. Using this weird generator
fu can lead to problems since generators cannot
be reused, but a do-notation block is supposed
to be a value semantically, which means it should
be able to be reused. The generator approach also
cannot accommodate monads like the list monad that
apply their bound function more than once.
#### filterM :: Consable t, Applicative f &#8658; (Type f, (a &#8594; f bool)) &#8594; t a &#8594; f (t a)

Filters a specified list by using a predicate with results
in the specified applicative. Returns the filtered list in the
specified applicative.
#### foldlM :: Foldable t, Monad m &#8658; (Type m, (b, a) &#8594; m b) &#8594; b &#8594; t a &#8594; m b

Monadic fold over a structure, from left to right.
#### foldrM :: Foldable t, Monad m &#8658; (Type m, (a, b) &#8594; m b) &#8594; b &#8594; t a &#8594; m b

Monadic fold over a structure, from right to left.
#### forever :: Monad m &#8658; m a &#8594; m ()

Repeat a monadic action an infinite number of
times. Note that this will never return a result
nor will it ever allow another action to be sequenced
after it.
#### guard :: Alternative f &#8658; (bool, Type f) &#8594; f ()

Guards further MonadPlus binding/sequencing when
the provided condition is false, due to the law
that empty >>= f = empty
#### id :: a &#8594; a

Always returns the value it is applied to.
#### mapM :: Consable t, Applicative f &#8658; (Type f, (a &#8594; f b)) &#8594; t a &#8594; f (t b)

mapM defined to work over any Consable structure and with Applicatives.

TODO: Implement the more generic Traversables and traverse and
define this in terms of that
#### replicateM :: Applicative f &#8658; (Type f, int, f a) &#8594; f [a]

Repeats the specified action cnt times and collects
the results into a list.
#### seqAll :: Monad m &#8658; (Type m, [m a]) &#8594; m [a]

Like all, but uses monadic sequencing instead of
applicative sequencing. This enforces sequential
execution for Monads whose Applicative instance
is concurrent. This is useful when prior actions
might
#### seqMapM :: Monad m &#8658; (Type m, a &#8594; m b) &#8594; [a] &#8594; m [b]

mapM restricted to lists and using monadic chaining.
#### unless :: Applicative f &#8658; (bool, f ()) &#8594; f ()

Performs the specified action when the specified
condition is false.
#### when :: Applicative f &#8658; (bool, f ()) &#8594; f ()

Performs the specified action when the specified
condition is true.
