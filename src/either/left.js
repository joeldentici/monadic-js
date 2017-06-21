'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Either.Left
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	The Left constructor
 */
class Left extends CaseClass {
	/**
	 *	new :: a -> Left a
	 *
	 *	Construct a Left
	 */
	constructor(val) {
		super('Left');
		this.val = val;
	}

	/**
	 *	map :: Left c -> (a -> b) -> Left c
	 *
	 *	Doesn't apply the function per Either semantics.
	 */
	map(fn) {
		return this;
	}

	/**
	 *	bind :: Left c -> (a -> Either c b) -> Left c
	 *
	 *	Doesn't apply the function per Either semantics.
	 */
	bind(fn) {
		return this;
	}

	/**
	 *	doCase :: Left a -> (a -> b) -> b
	 *
	 *	Applies the function to the value in the
	 *	Left
	 */
	doCase(fn) {
		return fn(this.val);
	}
}

module.exports = (a) => new Left(a);