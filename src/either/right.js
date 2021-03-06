'use strict';
const CaseClass = require('../utility.js').CaseClass;

/**
 *	MonadicJS.Either.Right
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	The Right constructor
 */
class Right extends CaseClass {
	/**
	 *	new :: a -> Right a
	 *
	 *	Construct a Right
	 */
	constructor(val) {
		super('Right');
		this.val = val;
	}

	/**
	 *	map :: Right a -> (a -> b) -> Right b
	 *
	 *	Apply the function to the value contained
	 *	in this Right.
	 */
	map(fn) {
		return new Right(fn(this.val));
	}

	/**
	 *	bind :: Right a -> (a -> Either c b) -> Either c b
	 *
	 *	Apply the function to the value contained
	 *	in this Right.
	 */
	bind(fn) {
		return fn(this.val);
	}

	/**
	 *	chain :: Right a -> (a -> Either c b) -> Either c b
	 *
	 *	Alias for bind. Provided for fantasy-land compliance.
	 */
	chain(fn) {
		return this.bind(fn);
	}

	/**
	 *	app :: Right (a -> b) -> Either a -> Left b
	 *
	 *	Applicative application
	 */
	app(v) {
		return this.chain(f => v.map(f));
	}

	/**
	 *	ap :: Right a -> Either (a -> b) -> Left b
	 *
	 *	Applicative application for fantasy-land
	 */
	ap(f) {
		return f.app(this);
	}

	/**
	 *	doCase :: Right a -> (a -> b) -> b
	 *
	 *	Apply the function to the value contained
	 *	in this Right.
	 */
	doCase(fn) {
		return fn(this.val);
	}
}


module.exports.Right = Right;
module.exports.constructRight = (a) => new Right(a);