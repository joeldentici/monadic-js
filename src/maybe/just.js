'use strict';
const CaseClass = require('../utility.js').CaseClass;

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
	 *	app :: Just (a -> b) -> Maybe a -> Maybe b
	 *
	 *	Applicative application.
	 */
	app(v) {
		return this.chain(f => v.map(f));
	}

	/**
	 *	ap :: Just a -> Maybe (a -> b) -> Maybe b
	 *
	 *	Applicative application, for fantasy-land.
	 */
	ap(f) {
		return f.app(this);
	}

	/**
	 *	alt :: Just a -> Maybe b -> Just a
	 */
	alt(o) {
		return this;
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

module.exports = {
	constructJust: (a) => new Just(a),
	Just
};