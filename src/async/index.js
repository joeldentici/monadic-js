const AsyncComputation = require('./asynccomputation.js');
const AsyncHandler = require('./asynchandler.js');
const Free = require('../free');

/**
 *	Monadic.Async
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	The Async monad represents computations
 *	that run in an asynchronous context.
 *
 *	Unlike Promises, an Async computation is
 *	lazily evaluated, so it won't be executed
 *	immediately.
 *
 *	Async provides an Interpreter to be used
 *	with the Free.createInterpreter function so it
 *	can be used with other Free monads. It maps to
 *	Async, as it is expected that most interpreters
 *	will do the same. Because of this, it essentially
 *	doesn't do anything.
 *
 *	A method called run is also provided to 
 *	interpret an Async into a Promise.
 */

class Async {
	/**
	 *	create :: ((a -> ()) -> (b -> ()) -> ()) -> Async b a
	 *
	 *	Creates an Async computation. Takes a function that
	 *	accepts two functions, one for a successful computation
	 *	an one for a failed computation. This function is not
	 *	executed until the Async is ran.
	 */
	static create(thunk) {
		return Free.liftF(new AsyncComputation(thunk, x => x));
	}

	/**
	 *	catch :: Async b a -> (b -> Async c d) -> Async c d
	 *
	 *	Creates an Async handler. This takes an Async computation
	 *	and an error handler function.
	 */
	static catch(asyncVal, handler) {
		return Free.liftF(new AsyncHandler(asyncVal, handler, x => x));
	}

	/**
	 *	try :: Async b a -> Async b a
	 *
	 *	Adds a "catch" method to the provided Async computation.
	 *	This is a convenience method to allow Async.catch to be
	 *	infix, and make monadic code look more imperative.
	 */
	static try(asyncVal) {
		asyncVal.catch = function(handler) {
			return Async.catch(asyncVal, handler);
		};

		return asyncVal;
	}

	/**
	 *	wrap :: (...any -> (b -> c -> ()) -> ()) -> ...any -> Async b c
	 *
	 *	Wraps a callback taking async function so it becomes a function
	 *	that returns Async computations.
	 */
	static wrap(fn) {
		return function(...args) {
			return Async.create((succ, fail) => {
				const allArgs = args.concat([(err, val) => {
					if (err) fail(err);
					else succ(val);
				}]);

				fn(...allArgs);
			});
		}
	}

	/**
	 *	unit :: a -> Async () a
	 *
	 *	Puts a value into the context of
	 *	an Async computation.
	 */
	static unit(v) {
		return Free.unit(v);
	}

	/**
	 *	fail :: a -> Async a ()
	 *
	 *	Returns an Async computation that failed
	 *	for the specified reason.
	 */
	static fail(e) {
		return Async.create((succ, fail) => fail(e));
	}

	/**
	 *	run :: Async b a -> Promise a b
	 *
	 *	Runs the asynchronous computation and
	 *	returns a promise for the result.
	 */
	static run(comp) {
		return comp.case({
			Free: x => x.case({
				AsyncComputation: (t, n) => new Promise(t).then(v => Async.run(n(v))),
				AsyncHandler: (a, h, n) => Async.run(a)
					.catch(e => Async.run(h(e)))
					.then(v => Async.run(n(v))),
				default: () => Promise.reject(new Error(
					"Expected Async computation, got: " + x.__type__)),
			}),
			Return: x => Promise.resolve(x),
		});
	}
}

/* The Async interpreter doesn't do anything,
it just exists so Async can be used with other
Free monads. It literally maps Asyncs back onto Asyncs.

Other Free monads will provide interpreters to 
*/
Async.interpreter = () => ({
	/**
	 *	prepare :: Async.interpret -> () -> Async ()
	 *
	 *	Prepares interpretation context for Async.
	 */
	prepare() {
		return Async.unit();
	},

	/**
	 *	map :: AsyncComputation ((a -> ()) -> (b -> ()) -> ()) -> Async b a
	 *
	 *	Maps an AsyncComputation into a new Async, essentially doing
	 *	nothing.
	 */
	map(comp) {
		return comp.case({
			AsyncComputation: (t, n) => [Async.create(t), n],
			AsyncHandler: (a, h, n) => [Async.catch(a, h), n],
			default: () => null,
		});
	},

	/**
	 *	cleanup :: Async b a -> Async b a
	 *
	 *	We don't need to clean up anything.
	 */
	cleanup(result) {
		return result;
	}
});

module.exports = Async;