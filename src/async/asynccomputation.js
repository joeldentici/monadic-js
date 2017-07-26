'use strict';
const CaseClass = require('../utility.js').CaseClass;
const Rx = require('rx');

/**
 *	MonadicJS.Async.AsyncComputation
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds a thunked computation.
 */
class AsyncComputation extends CaseClass {
	/**
	 *	new :: ((a -> (), e -> ()) -> c) -> Async c e a
	 *
	 *	Creates an Async computation from the provided thunked
	 *	computation, which will be called with callbacks for a result
	 *	or error when the Async computation is forked/ran.
	 */
	constructor(thunk) {
		super('AsyncComputation');
		//always wrap thunk application in try-catch
		//so we can turn normal throws into Async fails
		this.thunk = (succ, fail) => {
			try {
				return thunk(succ, fail);
			}
			catch (e) {
				return fail(e);
			}
		};
	}

	/**
	 *	fork :: Async c e a -> (a -> (), e -> ()) -> ()
	 *
	 *	Runs the Async computation. The success or fail
	 *	function is applied to its result, depending on
	 *	whether it is successful or not.
	 */
	fork(s, f) {
		let done = false;
		let v;

		const succ = x => {
			if (!done) 
				v = s(x);
			done = true;
			return v;
		};

		const fail = x => {
			if (!done)
				v = f(x);
			done = true;
			return v;
		}

		return AsyncComputation.schedule(() => this.thunk(succ, fail));
	}

	/**
	 *	run :: Async c e a -> ()
	 *
	 *	Forks the computation and throws away the results.
	 *
	 *	Useful for when you were using the Async results to
	 *	do side effects that could throw errors in a tap
	 *	and wanted to catch them using chainFail/catch.
	 */
	run() {
		return this.fork(x => x, e => e);
	}

	/**
	 *	toPromise :: Async c e a -> Promise a e
	 *
	 *	This is the same as forking the computation, but
	 *	you get back a Promise for the result.
	 */
	toPromise() {
		return new Promise((s, f) => this.fork(s, f));
	}

	/**
	 *	toObservable :: Async c e a -> Observable e a
	 *
	 *	Creates an Observable that will run this computation
	 *	for every observer to produce a single value for that
	 *	observer and complete, or will end with an error if
	 *	the computation fails.
	 *
	 *	This can be useful for running actions in response to
	 *	each event emitted by an Observable by chaining/binding
	 *	a function to it that returns Observables created by calling
	 *	this method on an Async.
	 *
	 *	Note that this does not break the laziness of an Async computation
	 *	as Observables are also lazy.
	 *
	 *	Remember to call .share as appropriate if you only want the
	 *	Async computation to run once for all observers.
	 */
	toObservable() {
		return Rx.Observable.create((observer) => {
			this.fork(x => {
				observer.onNext(x);
				observer.onCompleted();
			}, e => {
				observer.onError(e);
			});
		});
	}

	/**
	 *	bind :: Async c e a -> (a -> Async c e b) -> Async c e b
	 *
	 *	Alias for chain.
	 */
	bind(f) {
		return this.chain(f);
	}

	/**
	 *	chain :: Async c e a -> (a -> Async c e2 b) -> Async c e2 b
	 *
	 *	Monadic binding of Async computations. The computations
	 *	run sequentially. Failed computations do not get piped
	 *	through.
	 */
	chain(f) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			return this.fork(chainIt(succ, fail, f), fail);
		});
	}

	/**
	 *	chainFail :: Async c e a -> (e -> Async c e2 b) -> Async c e2 b
	 *
	 *	Same as chain/bind but the function is applied when this
	 *	computation fails.
	 */
	chainFail(f) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			return this.fork(succ, chainIt(succ, fail, f));
		});
	}

	/**
	 *	catch :: Async c e a -> (e -> Async c e2 b) -> Async c e2 b
	 *
	 *	Alias for chainFail.
	 */
	catch(f) {
		return this.chainFail(f);
	}

	/**
	 *	map :: Async c e a -> (a -> b) -> Async c e b
	 *
	 *	Applies the function to the result of this computation.
	 */
	map(f) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			return this.fork(mapIt(succ, fail, f), fail);
		});
	}

	/**
	 *	tap :: Async c e a -> (a -> ()) -> Async c e a
	 *
	 *	Tap into the Async computation at a certain point
	 *	to perform a side effect. This should be used with
	 *	care and mainly only by the consumer of an Async computation.
	 */
	tap(f) {
		return this.map(x => {
			f(x);
			return x;
		});
	}

	/**
	 *	mapCatch :: Async c e a -> (e -> e2) -> Async c e2 a
	 *
	 *	Applies the function to the error of this computation.
	 */
	mapFail(f) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			return this.fork(succ, mapIt(fail, fail, f));
		});
	}

	/**
	 *	tapFail :: Async c e a -> (e -> ()) -> Async c e a
	 *
	 *	Tap for failures.
	 */
	tapFail(f) {
		return this.mapFail(e => {
			f(e);
			return e;
		});
	}

	/**
	 *	app :: Async c e (a -> b) -> Async c e a -> Async c e b
	 *
	 *	Applicative application. Applies the function result of
	 *	this Async computation to the result of the specified Async
	 *	computation. If used with an n-ary curried function, then
	 *	app can be chained n times to fully apply it.
	 *
	 *	This is written such that chained applications will run
	 *	the computations concurrently.
	 */
	app(av) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			let value, fn, count = 0;

			//when both the value and this Async
			//have finished, we apply the function
			//to the value and succeed. Note: We
			//can never have access to both if one
			//fails, so in that case we never call succ
			//which is correct.
			const run = () => {
				if (count === 2)
					return succ(fn(value));
			}

			//run this Async to get the function
			const v1 = this.fork(f => {
				fn = f;
				count++;
				return run();
			}, fail);

			//run the value Async to get the value
			const v2 = av.fork(v => {
				value = v;
				count++;
				return run();
			}, fail);

			return v1 || v2;
		});
	}

	/**
	 *	ap :: Async c e a -> Async c e (a -> b) -> Async c e b
	 *
	 *	Flipped arguments for app. This is for fantasy-land, but
	 *	probably isn't very useful as it breaks chaining.
	 */
	ap(af) {
		return af.app(this);
	}

	/**
	 *	seqL :: Async c e a -> Async c e b -> Async c e a
	 *
	 *	Sequences Async computations, keeping the value of
	 *	the one on the left. The computations are ran concurrently.
	 */
	seqL(o) {
		return this.map(x => y => x).app(o);
	}

	/**
	 *	seqR :: Async c e a -> Async c e b -> Async c e b
	 *
	 *	Sequence Async computations, keeping the value of
	 *	the one on the right. The computations are ran concurrently.
	 */
	seqR(o) {
		return this.map(x => y => y).app(o);
	}

	/**
	 *	alt :: Async c e a -> Async c e b -> Async c e (a | b)
	 *
	 *	Alternative sequencing. The computation on the left is
	 *	ran and if it is successful, its result is used. If it
	 *	fails, then the computation on the right is ran and its
	 *	result is used.
	 */
	alt(o) {
		return this.catch(e => o);
	}

	/**
	 *	doCase :: Async c e a -> (((a -> (), e -> ()) -> c) -> b) -> b
	 *
	 *	Applies the function to the thunked computation.
	 */
	doCase(fn) {
		return fn(this.thunk);
	}
}

//use whatever is available for breaking up
//execution (note we are calling with global this on purpose)
AsyncComputation.schedule = x => (setImmediate || setTimeout)(x);

/**
 *	later :: (a -> b) -> a -> ()
 *
 *	Wraps the application to the specified function
 *	in an application of the scheduling function.
 */
function later(fn) {
	return function(x) {
		return AsyncComputation.schedule(() => fn(x));
	}
}

/**
 *	mapIt :: ((b -> ()), (e -> ()), (a -> b)) -> (a -> ())
 *
 *	Returns a new function that applies fn to whatever value
 *	it gets and then applies cont to that. If an error occurs
 *	in fn, then we will catch it and fail with it.
 *
 *	Note: This allows breaking out of the monadic control flow
 *	by throwing in a map, but it is very important that we don't
 *	bring down an entire application by one Async computation having
 *	an error in it.
 */
function mapIt(cont, fail, fn) {
	return function(x) {
		try {
			return cont(fn(x));
		}
		catch (e) {
			return fail(e);
		}
	}
}

/**
 *	chainIt :: ((b -> ()), (e -> ()), (a -> Async () e a)) -> (a -> ())
 *
 *	Performs the monadic chaining while catching any errors that occur.
 */
function chainIt(succ, fail, fn) {
	return function(x) {
		try {
			return fn(x).fork(succ, fail);
		}
		catch (e) {
			return fail(e);
		}
	}
}

module.exports = AsyncComputation;