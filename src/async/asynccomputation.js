'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Async.AsyncComputation
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
		this.thunk = thunk;
	}

	/**
	 *	fork :: Async c e a -> (a -> (), e -> ()) -> ()
	 *
	 *	Runs the Async computation. The success or fail
	 *	function is applied to its result, depending on
	 *	whether it is successful or not.
	 */
	fork(s, f) {
		immediate(() => this.thunk(s, f));
	}

	/**
	 *	run :: Async c e a -> Promise a e
	 *
	 *	This is the same as forking the computation, but
	 *	you get back a Promise for the result.
	 */
	run() {
		return new Promise((s, f) => this.fork(s, f));
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

			this.fork(v => f(v).fork(succ, fail), fail);
		});
	}

	/**
	 *	catch :: Async c e a -> (e -> Async c e2 b) -> Async c e2 b
	 *
	 *	Same as chain/bind but the function is applied when this
	 *	computation fails.
	 */
	catch(f) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			this.fork(succ, e => f(e).fork(succ, fail));
		});
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

			this.fork(compose(succ, f), fail);
		});
	}

	/**
	 *	mapCatch :: Async c e a -> (e -> e2) -> Async c e2 a
	 *
	 *	Applies the function to the error of this computation.
	 */
	mapCatch(f) {
		return new AsyncComputation((succ, fail) => {
			succ = later(succ);
			fail = later(fail);

			this.fork(succ, compose(fail, f));
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

			let value, fn;

			//when both the value and this Async
			//have finished, we apply the function
			//to the value and succeed. Note: We
			//can never have access to both if one
			//fails, so in that case we never call succ
			//which is correct.
			const run = () => {
				if (fn && value)
					succ(fn(value));
			}

			//run the value Async to get the value
			av.fork(v => {
				value = v;
				run();
			}, fail);

			//run this Async to get the function
			this.fork(f => {
				fn = f;
				run();
			}, fail);
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
//execution
const immediate = setImmediate || setTimeout;

/**
 *	later :: (a -> b) -> a -> ()
 *
 *	Wraps the application to the specified function
 *	in an application of the immediate function.
 */
function later(fn) {
	return function(x) {
		return immediate(() => fn(x));
	}
}

/**
 *	compose :: (b -> c) -> (a -> b) -> a -> c
 *
 *	Just normal old function composition.
 */
function compose(g, f) {
	return function(x) {
		return g(f(x));
	}
}

module.exports = AsyncComputation;