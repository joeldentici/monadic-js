'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Free.Return
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	The "leaves" of the Free functor nesting
 *	mess are contained in Return values.
 */
class Return extends CaseClass {
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
		return new Return(f(this.val));
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
	 *	doCase :: Free f a -> (a -> b) -> b
	 *
	 *	Apply the function to the value contained
	 *	in this context.
	 */
	doCase(fn) {
		return fn(this.val);
	}
}

module.exports = (a) => new Return(a);