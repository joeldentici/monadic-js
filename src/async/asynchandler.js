'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Async.AsyncHandler
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds an AsyncComputation and a handler
 *	for a failed computation.
 */
class AsyncHandler extends CaseClass {
	constructor(asyncVal, handler, continuation) {
		super('AsyncHandler');
		this.val = asyncVal;
		this.handler = handler;
		this.continuation = continuation;
	}

	map(fn) {
		return new AsyncHandler(
			this.val, this.handler, x => fn(this.continuation(x)));
	}

	doCase(fn) {
		return fn(this.val, this.handler, this.continuation);
	}
}
module.exports = AsyncHandler;