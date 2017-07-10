const AsyncComputation = require('./asynccomputation.js');
const AsyncHandler = require('./asynchandler.js');
const AsyncFirst = require('./asyncfirst.js');
const Free = require('../free');
const {mapM} = require('../utility.js');

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
	 *	wrapPromise :: (...any -> Promise a e) -> ...any -> Async a e
	 *
	 *	Wraps a promise returning async function so it becomes a function
	 *	that returns Async computations.
	 */
	static wrapPromise(fn) {
		return function(...args) {
			return Async.create((succ, fail) => 
				fn(...args).then(succ, fail));
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
	 *
	 *	run only runs the Async on the first application.
	 *	Any subsequent applications will return the promise
	 *	from the first application.
	 */
	static run(comp) {
		if (!comp.__res__) {
			const res = comp.case({
				Free: x => x.case({
					AsyncComputation: (t, n) => new Promise(t).then(v => Async.run(n(v))),
					AsyncHandler: (a, h, n) => Async.run(a)
						.catch(e => Async.run(h(e)))
						.then(v => Async.run(n(v))),
					AsyncFirst: (cs, n) => Promise
						.race(cs.map(c => Async.run(c)))
						.then(v => Async.run(n(v))),
					default: () => Promise.reject(new Error(
						"Expected Async computation, got: " + x.__type__)),
				}),
				Return: x => Promise.resolve(x),
			});

			comp.__res__ = res;
		}

		return comp.__res__;
	}

	/**
	 *	sleep :: int -> Async ()
	 *
	 *	Creates an Async computation that sleeps for the specified
	 *	timespan in milliseconds and returns no result.
	 */
	static sleep(ms) {
		return Async.create((succ, fail) => setTimeout(succ, ms));
	}

	/**
	 *	all :: ...Async e a -> Async e [a]
	 *
	 *	Returns an Async computation whose result
	 *	combines all the results from the provided
	 *	Asyncs.
	 */
	static all(...comps) {
		return mapM(Async, x => x, comps);
	}

	/**
	 *	first :: ...Async e a -> Async e a
	 *
	 *	Returns an Async computation whose result is
	 *	the result of the first provided computation to
	 *	finish.
	 */
	static first(...comps) {
		return Free.liftF(new AsyncFirst(comps, x => x));
	}

	/**
	 *	throwE :: e -> Async e ()
	 *
	 *	Alias of fail
	 */
	static throwE(e) {
		return Async.fail(e);
	}

	/**
	 *	await :: Promise a e -> Async e a
	 *
	 *	This will wait for the value from the
	 *	specified promise when the Async is ran.
	 */
	static await(promise) {
		return Async.create((succ, fail) => promise.then(succ, fail));
	}
}

/* The Async interpreter doesn't do anything,
it just exists so Async can be used with other
Free monads. It literally maps Asyncs back onto Asyncs.

Other Free monads will provide interpreters to map to
Async as well
*/
Async.interpreter = (execute) => ({
	/**
	 *	prepare :: Interpreter -> () -> Async ()
	 *
	 *	Prepares interpretation context for Async.
	 */
	prepare() {
		return Async.unit();
	},

	/**
	 *	map :: Interpreter -> AsyncFunctor b a -> [Async b a, (a -> Free f a | Free f a)]
	 *
	 *	Maps an AsyncComputation into a new Async, essentially doing
	 *	nothing.
	 */
	map(comp) {
		return comp.case({
			AsyncComputation: (t, n) => [Async.create(t), n],
			AsyncHandler: (a, h, n) => [Async.catch(execute(a), h), n],
			AsyncFirst: (cs, n) => [Async.first(cs.map(execute)), n],
			default: () => null,
		});
	},

	/**
	 *	cleanup :: Interpreter -> a -> Async () ()
	 *
	 *	We don't need to clean up anything.
	 */
	cleanup(result) {
		return Async.unit();
	},

	/**
	 *	cleanupErr :: Interpreter -> b -> Async () ()
	 *
	 *	We don't need to clean up anything.
	 */
	cleanupErr(err) {
		return Async.unit();
	}
});

module.exports = Async;