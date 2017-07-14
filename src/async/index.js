const AsyncComputation = require('./asynccomputation.js');
const AsyncFirst = require('./asyncfirst.js');
const Free = require('../free');
const {all} = require('../utility.js');

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
 *	immediately. Asyncs can be turned into Promises
 *	by calling "run" on them and Promises can be turned
 *	into Asyncs by applying Async.fromPromise to them
 */

class Async {
	/**
	 *	create :: ((a -> ()) -> (e -> ()) -> c) -> Async c e a
	 *
	 *	Creates an Async computation. Takes a function that
	 *	accepts two functions, one for a successful computation
	 *	an one for a failed computation. This function is not
	 *	executed until the Async is ran.
	 */
	static create(thunk) {
		return new AsyncComputation(thunk);
	}

	/**
	 *	try :: Async c e a -> Async c e a
	 *
	 *	This method literally doesn't do anything. It is just
	 *	here to make catching look more imperative by surrounding
	 *	it with try.
	 */
	static try(asyncVal) {
		return asyncVal;
	}

	/**
	 *	wrap :: ((...any, e -> a -> ()) -> c) -> ...any -> Async c e a
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
	 *	wrapPromise :: (...any -> Promise a e) -> ...any -> Async (Promise a e) e a
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
	 *	unit :: a -> Async () () a
	 *
	 *	Puts a value into the context of
	 *	an Async computation.
	 */
	static unit(v) {
		return Async.create((succ, fail) => {
			succ(v);
		});
	}

	/**
	 *	of :: a -> Async () () a
	 *
	 *	Alias for unit. Provided for fantasy-land
	 *	compliance.
	 */
	static of(v) {
		return this.unit(v);
	}

	/**
	 *	fail :: e -> Async () e ()
	 *
	 *	Returns an Async computation that failed
	 *	for the specified reason.
	 */
	static fail(e) {
		return Async.create((succ, fail) => {
			fail(e);
		});
	}

	/**
	 *	run :: Async c e a -> Promise a e
	 *
	 *	Runs the asynchronous computation and
	 *	returns a promise for the result.
	 *
	 *	You can use Async.fork or async.fork as
	 *	well to get the result or error passed to
	 *	a continuation, which is probably the better
	 *	way to do it since you should be eliminating
	 *	promises anyway.
	 */
	static run(comp) {
		return comp.run();
	}

	/**
	 *	fork :: (Async c b a, (a -> d), (b -> e)) -> c
	 *
	 *	Runs the asynchronous computation. Its result
	 *	will be passed to succ or fail as appropriate.
	 */
	static fork(async, succ, fail) {
		return async.fork(succ, fail);
	}

	/**
	 *	sleep :: int -> Async int () ()
	 *
	 *	Creates an Async computation that sleeps for the specified
	 *	timespan in milliseconds and returns no result.
	 */
	static sleep(ms) {
		return Async.create((succ, fail) => setTimeout(succ, ms));
	}

	/**
	 *	all :: ...Async c e a -> Async c e [a]
	 *
	 *	Returns an Async computation whose result
	 *	combines all the results from the provided
	 *	Asyncs.
	 *
	 *	If any of the Asyncs fail, then the resulting
	 *	Async will have its error.
	 *
	 *	This can be called with an array or rest args.
	 *
	 *	There must be at least one computation provided,
	 *	regardless of how this is called.
	 */
	static all(...comps) {
		//handle calls with an array instead of rest args
		if (comps.length === 1 && comps[0] instanceof Array)
			comps = comps[0];

		return all(comps);
	}

	/**
	 *	first :: ...Async c e a -> Async c e a
	 *
	 *	Returns an Async computation whose result is
	 *	the result of the first provided computation to
	 *	finish.
	 */
	static first(...comps) {
		return new AsyncFirst(comps);
	}

	/**
	 *	throwE :: e -> Async () e ()
	 *
	 *	Alias of fail
	 */
	static throwE(e) {
		return Async.fail(e);
	}

	/**
	 *	await :: Promise a e -> Async (Promise a e) e a
	 *
	 *	This basically just maps Promises into
	 *	Asyncs.
	 */
	static await(promise) {
		return Async.create((succ, fail) => promise.then(succ, fail));
	}

	/**
	 *	fromPromise :: Promise a e -> Async (Promise a e) e a
	 *
	 *	Alias of await
	 */
	static fromPromise(promise) {
		return Async.await(promise);
	}
}



module.exports = Async;