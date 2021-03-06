'use strict';
const CaseClass = require('../utility.js').CaseClass;

/**
 *	MonadicJS.Either.Left
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
	 *	app :: Left e () -> Either e a -> Left e ()
	 *
	 *	Applicative application
	 */
	app(v) {
		return this;
	}

	/**
	 *	ap :: Left a -> Either e (a -> b) -> Left a
	 *
	 *	Applicative application for fantasy-land
	 */
	ap(f) {
		return f.app(this);
	}

	/**
	 *	chain :: Left c -> (a -> Either c b) -> Left c
	 *
	 *	Alias for bind. Provided for fantasy-land compliance.
	 */
	chain(fn) {
		return this.bind(fn);
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

module.exports.constructLeft = (a) => new Left(a);

module.exports.Left = Left;