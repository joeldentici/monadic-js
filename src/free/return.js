'use strict';
const CaseClass = require('js-helpers').CaseClass;
const Return = module.exports = (a) => new Return_(a);
const Free = require('./free.js');
const Async = require('../async');

/**
 *	Monadic.Free.Return
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	The "leaves" of the Free functor nesting
 *	mess are contained in Return values.
 */
class Return_ extends CaseClass {
	/**
	 *	new :: a -> Free f a
	 *
	 *	Takes a value of type a and wraps it
	 *	into the free monad.
	 */
	constructor(val) {
		super('Return');
		this.val = val;
	}

	/**
	 *	map :: Free f a -> (a -> b) -> Free f b
	 *
	 *	Apply the function to the value contained
	 *	in this container.
	 */
	map(f) {
		return Return(f(this.val));
	}

	/**
	 *	bind :: Free f a -> (a -> Free f b) -> Free f b
	 *
	 *	Apply the function to the value contained in this
	 *	container
	 */
	bind(f) {
		return f(this.val);
	}

	/**
	 *	chain :: Free f a -> (a -> Free f b) -> Free f b
	 *
	 *	Alias for bind. Provided for fantasy-land compliance.
	 */
	chain(f) {
		return this.bind(f);
	}

	/**
	 *	doCase :: Free f a -> (a -> b) -> b
	 *
	 *	Apply the function to the value contained
	 *	in this context.
	 */
	doCase(fn) {
		return fn(this.val);
	}

	/**
	 *	ap :: Free f (a -> b) -> Free f a -> Free f b
	 *
	 *	Applies the function in this Return to the
	 *	value in the provided Free.
	 */
	ap(v) {
		const a = this.val;
		return v.case({
			Return: b => Return(a(b)),
			Free: mb => Free(mb.map(x => x.map(a))),
		});
	}
}