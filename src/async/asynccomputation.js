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
	constructor(thunk, continuation) {
		super('AsyncComputation');
		this.thunk = thunk;
		this.continuation = continuation;
	}

	map(fn) {
		return new AsyncComputation(
			this.thunk, x => fn(this.continuation(x)));
	}

	doCase(fn) {
		return fn(this.thunk, this.continuation);
	}
}
module.exports = AsyncComputation;