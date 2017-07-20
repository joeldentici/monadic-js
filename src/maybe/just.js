'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	MonadicJS.Maybe.Just
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	The Just constructor
 */
class Just extends CaseClass {
	/**
	 *	new :: a -> Just a
	 *
	 *	Construct a Just
	 */
	constructor(val) {
		super('Just');
		this.val = val;
	}

	/**
	 *	map :: Just a -> (a -> b) -> Just b
	 *
	 *	Apply the function to the value contained
	 *	in this Just.
	 */
	map(fn) {
		return new Just(fn(this.val));
	}

	/**
	 *	bind :: Just a -> (a -> Maybe b) -> Maybe b
	 *
	 *	Apply the function to the value contained
	 *	in this Just.
	 */
	bind(fn) {
		return fn(this.val);
	}

	/**
	 *	chain :: Just a -> (a -> Maybe b) -> Maybe b
	 *
	 *	Alias for bind. Provided for fantasy-land compliance.
	 */
	chain(fn) {
		return this.bind(fn);
	}

	/**
	 *	doCase :: Just a -> (a -> b) -> b
	 *
	 *	Apply the function to the value contained
	 *	in this Just.
	 */
	doCase(fn) {
		return fn(this.val);
	}
}

module.exports = (a) => new Just(a);