'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Free.Free
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *
 *	Implementation of the free monad.
 */
class Free extends CaseClass {
	/**
	 *	new :: f (Free f a) -> Free f a
	 *
	 *	Takes a value in the functor over the free monad over that
	 *	functor and places it into the context of the free monad
	 *	over that functor. In other words, this nests the free monad
	 *	context one level, which will later be stripped away in an interpreter.
	 */
	constructor(x) {
		super('Free');
		this.x = x;
	}

	/**
	 *	map :: Free f a -> (a -> b) -> Free f b
	 *
	 *	Apply the function within the free monad context.
	 *
	 *	This means we map the function recursively by mapping
	 *	it on the free monad context contained in the functor
	 *	contained in this free monad. Eventually we will hit a
	 *	Return and the recursion will stop.
	 */
	map(f) {
		return new Free(this.x.map(
			v => v.map(f)));
	}

	/**
	 *	bind :: Free f a -> (a -> Free f b) -> Free f b
	 *
	 *	Apply the function within the free monad context.
	 *
	 *	This means we bind the function to the free monad
	 *	inside the functor in this free monad (which is
	 *	recursive). Eventually we will hit a Return and the
	 *	recursion will stop.
	 */
	bind(f) {
		return new Free(this.x.map(
			v => v.bind(f)));
	}

	/**
	 *	doCase :: Free f a -> (f (Free f a) -> b) -> b
	 *
	 *	Apply the function to the functor in this context.
	 */
	doCase(fn) {
		return fn(this.x);
	}
}

module.exports = (a) => new Free(a);