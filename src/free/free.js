'use strict';
const CaseClass = require('js-helpers').CaseClass;

const Free = module.exports = (a) => new Free_(a);
/**
 *	Monadic.Free.Free
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *
 *	Implementation of the free monad.
 */
class Free_ extends CaseClass {
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
		return Free(this.x.map(
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
		return Free(this.x.map(
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

	/**
	 *	ap :: Free f (a -> b) -> Free f a -> Free f b
	 *
	 *	Applies the function in this Free to the value
	 *	inside the provided Free.
	 */
	ap(v) {
		const ma = this.x;
		return v.case({
			Return: b => Free(ma.map(x => x.map(f => f(b)))),
			Free: mb => Free(ma.map(a => b => a.ap(b)).ap(mb)),
		});
	}
}