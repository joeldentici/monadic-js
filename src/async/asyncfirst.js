'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Async.AsyncFirst
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds a set of AsyncComputations.
 */
class AsyncFirst extends CaseClass {
	constructor(comps, continuation) {
		super('AsyncFirst');
		this.comps = comps;
		this.continuation = continuation;
	}

	map(fn) {
		return new AsyncFirst(
			this.comps, x => fn(this.continuation(x)));
	}

	doCase(fn) {
		return fn(this.comps, this.continuation);
	}
}
module.exports = AsyncFirst;