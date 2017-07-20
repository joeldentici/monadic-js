'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	MonadicJS.Maybe.Nothing
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	The Nothing type
 */
class Nothing extends CaseClass {
	constructor() {
		super('Nothing');
	}

	/**
	 *	map :: Nothing -> (a -> b) -> Nothing
	 *
	 *	Doesn't apply the function per Maybe semantics.
	 */
	map(fn) {
		return this;
	}

	/**
	 *	bind :: Nothing -> (a -> Maybe b) -> Nothing
	 *
	 *	Doesn't apply the function per Maybe semantics.
	 */
	bind(fn) {
		return this;
	}

	/**
	 *	chain :: Nothing -> (a -> Maybe b) -> Nothing
	 *
	 *	Alias for bind. Provided for fantasy-land compliance.
	 */
	chain(fn) {
		return this.bind(fn);
	}

	/**
	 *	doCase :: Nothing -> (() -> b) -> b
	 *
	 *	Applies the function
	 */
	doCase(fn) {
		return fn();
	}
}

module.exports = new Nothing();