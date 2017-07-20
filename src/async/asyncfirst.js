'use strict';
const AsyncComputation = require('./asynccomputation.js');

/**
 *	MonadicJS.Async.AsyncFirst
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds a set of AsyncComputations.
 */
class AsyncFirst extends AsyncComputation {
	/**
	 *	new :: [Async c e a] -> Async c e a
	 *
	 *	Constructs an AsyncFirst
	 */
	constructor(comps) {
		super(null);
		this.__type__ = 'AsyncFirst';
		this.comps = comps;
	}

	/**
	 *	fork :: AsyncFirst e a -> (a -> b, e -> c) -> b | c
	 *
	 *	This overrides the AsyncComputation fork to fork all
	 *	the Async computations and keep the result of whatever
	 *	finishes first.
	 */
	fork(s, f) {
		let done = false;
		const succ = x => {
			if (!done)
				s(x);
			done = true;
		}

		const fail = x => {
			if (!done)
				f(x);
			done = true;
		}

		return this.comps.map(comp => comp.fork(succ, fail));
	}

	doCase(fn) {
		return fn(this.comps);
	}
}
module.exports = AsyncFirst;