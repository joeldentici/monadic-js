const AsyncComputation = require('./asynccomputation.js');
const AsyncFirst = require('./asyncfirst.js');
const {all} = require('../utility.js');

/**
 *	MonadicJS.Async
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
	 *	run :: Async c e a -> ()
	 *
	 *	Runs the asynchronous computation, discarding
	 *	the result.
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
	 *	toPromise :: Async c e a -> Promise a e
	 *
	 *	Forks the computation and returns a promise
	 *	for its result.
	 */
	static toPromise(comp) {
		return comp.toPromise();
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

		return all(Async, comps);
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

	/**
	 *	fromEither :: Either e a -> Async () e a
	 *
	 *	Creates an Async computation whose result or failure
	 *	is the value in the specified Either.
	 */
	static fromEither(either) {
		return either.case({
			Left: e => Async.fail(e),
			Right: r => Async.of(r),
		});
	}

	/**
	 *	fromMaybe :: Maybe a -> Async () NonExistenceError a
	 *
	 *	Creates an Async computation whose result is the
	 *	value in the Maybe. If the Maybe is Nothing, then
	 *	the Async computation will result in a NonExistenceError.
	 */
	static fromMaybe(maybe) {
		return maybe.case({
			Nothing: () => Async.fail(
				new NonExistenceError('Async.fromMaybe')),
			Just: r => Async.of(r),
		});
	}

	/**
	 *	parallel :: WebWorker -> ((a_0..a_n) -> b) -> (a_0..a_n) -> Async () Error b
	 *
	 *	Allows running functions in a fully parallel context.
	 *
	 *	Functions cannot be curried! If you try to use a curried
	 *	function with this, the result will be a CurryingError.
	 *	If you pass in a function that has already been curried,
	 *	you will get a ReferenceError on its curried arguments.
	 *	This is because the function is serialized to source and
	 *	passed to the worker for execution. Serializing a curried
	 *	function does not carry its environment, so it will have
	 *	free variables in its body.
	 *
	 *	Applying parallel to a WebWorker implementation returns
	 *	a function that can be used to wrap functions to run
	 *	on another thread/process and return their results in
	 *	an Async.
	 *
	 *	Note that you can achieve concurrency with CPU-bound
	 *	computations by just using Async computations -- All
	 *	you need to do is break them up into chains where you
	 *	return results with Async.of or even just by chaining
	 *	map from an initial Async.of() and turn iteration into
	 *	recursion (you can also write most loops as higher order
	 *	functions but that is inelegant). This works, but it isn't
	 *	truly parallel as it doesn't utilize multiple CPU cores. It
	 *	is essentially just time-sharing of coroutines (which can be
	 *	faster than threads or processes for simple tasks).
	 *
	 *	Using this will give you truly parallel computation.
	 */
	static parallel(Worker) {
		return fn => (...args) => {
			const worker = new Worker(function() {
				this.sendResult = function(result) {
					this.postMessage({
						type: 'result',
						result
					});
				}

				this.sendError = function(error) {
					const cons = error.constructor.name;
					const name = cons !== 'Object' ? cons : 'CurryingError';
					const message = error.message || '';

					this.postMessage({
						type: 'error',
						name,
						message,
					});
				}

				this.onmessage = function(event) {
					const fn = eval('x => ' + event.data.function)();
					const args = event.data.args;

					try {
						const res = fn(...args);
						if (typeof res === 'function') {
							this.sendError({
								message: "Don't use curried functions with Async.parallel",
							});
						}
						else {
							this.sendResult(res);
						}
					}
					catch (e) {
						this.sendError(e);
					}
				}
			});

			return Async.create((succ, fail) => {
				worker.onmessage = function(event) {
					worker.terminate();

					if (event.data.type === 'error') {
						const message = event.data.message;
						const name = event.data.name;

						if (name === 'CurryingError')
							fail(new CurryingError(message));
						else
							fail(global[name](message));
					}
					else if (event.data.type === 'result') {
						succ(event.data.result);
					}
				}

				worker.postMessage({
					function: '' + fn,
					args,
				});
			});
		}
	}
}

class NonExistenceError extends Error {
	constructor(method) {
		super(method + ': Received Maybe.Nothing');
	}
}

class CurryingError extends Error {

}



module.exports = Async;