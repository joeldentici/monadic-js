'use strict';

/**
 *	Monadic.Utility
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Utility functions for working with monads, applicatives,
 *	alternatives, and just functional stuff in general.
 */

/**
 *	doM :: Monad m => (() -> Iterator) -> m a
 *
 *	Do notation helper for monads. Taken from:
 *	https://curiosity-driven.org/monads-in-javascript
 *
 *	Example Usage:
 *	<pre>
 *	const result = doM(function*() {
 *	    const fst = yield Either.right(5);
 *	    const snd = yield Either.right(11);
 *	    return Either.unit(fst + snd);
 *	});
 *	</pre>
 *
 *	Note: It is recommended that you use the
 *	do-notation language extension provided,
 *	instead of this. Using this weird generator
 *	fu can lead to problems since generators cannot
 *	be reused, but a do-notation block is supposed
 *	to be a value semantically, which means it should
 *	be able to be reused. The generator approach also
 *	cannot accommodate monads like the list monad that
 *	apply their bound function more than once.
 */
const doM = exports.doM = function(genFn) {
	const gen = genFn();
	function step(value) {
		const result = gen.next(value);
		if (result.done) {
			return result.value;
		}
		return result.value.bind(step);
	}
	return step();
}

/**
 *	when :: Applicative f => (bool, f ()) -> f ()
 *
 *	Performs the specified action when the specified
 *	condition is true.
 */
const when = exports.when = function(cond, action) {
	if (cond)
		return action;
	else
		return action.constructor.of();
}

/**
 *	unless :: Applicative f => (bool, f ()) -> f ()
 *
 *	Performs the specified action when the specified
 *	condition is false.
 */
const unless = exports.unless = function(cond, action) {
	return when(!cond, action);
}

/**
 *	guard :: Alternative f => (bool, Type f) -> f ()
 *
 *	Guards further MonadPlus binding/sequencing when
 *	the provided condition is false, due to the law
 *	that empty >>= f = empty
 */
const guard = exports.guard = function(cond, alt) {
	if (cond)
		return alt.of();
	else
		return alt.zero();
}

/**
 *	constant :: a -> () -> a
 *
 *	When applied to a value, returns a function
 *	that will always return that value, regardless
 *	of what it is applied to.
 */
const constant = exports.constant = x => () => x;

/**
 *	id :: a -> a
 *
 *	Always returns the value it is applied to.
 */
const id = exports.id = x => x;


/**
 *	foldrM :: Foldable t, Monad m => (Type m, (a, b) -> m b) -> b -> t a -> m b
 *
 *	Monadic fold over a structure, from right to left.
 */
const foldrM = exports.foldrM = (monad, f) => z0 => xs => {
	const f2 = (k, x) => z => f(x, z).chain(k);

	return xs.foldl(f2, monad.of)(z0);
}

/**
 *	foldlM :: Foldable t, Monad m => (Type m, (b, a) -> m b) -> b -> t a -> m b
 *
 *	Monadic fold over a structure, from left to right.
 */
const foldlM = exports.foldlM = (monad, f) => z0 => xs => {
	const f2 = (x, k) => z => f(z, x).chain(k);

	return xs.foldr(f2, monad.of)(z0);
}

/**
 *	filterM :: Consable t, Applicative f => (Type f, (a -> f bool)) -> t a -> f (t a)
 *
 *	Filters a specified list by using a predicate with results
 *	in the specified applicative. Returns the filtered list in the
 *	specified applicative.
 */
const filterM = exports.filterM = (monad, predM) => xs => {
	const t = xs.constructor;

	const z0 = t.empty;

	const cons = t.cons;

	//choice consing
	const f = t => b => ts => b ? cons(t, ts) : ts;
	return xs.foldr(
		//choice consing
		(x, acc) => predM(x).map(f(x)).app(acc),
		monad.of(z0)
	);
}

/**
 *	mapM :: Consable t, Applicative f => (Type f, (a -> f b)) -> t a -> f (t b)
 *
 *	mapM defined to work over any Consable structure and with Applicatives.
 *
 *	TODO: Implement the more generic Traversables and traverse and
 *	define this in terms of that
 */
const mapM = exports.mapM = (monad, f) => xs => {
	const t = xs.constructor;

	const z0 = t.empty;

	const cons = t.cons;

	const consC = t => ts => cons(t, ts);

	return xs.foldr(
		(x, acc) => f(x).map(consC).app(acc),
		monad.of(z0)
	);
}

/**
 *	collect :: int=n -> (a -> a -> ... -> [a]).length=n+1
 *
 *	Constructs a function that collects n arguments into
 *	a list. This is used with Applicative application to
 *	collect results in parallel.
 */
const collect = exports.collect = function(n) {
	//creates a new "collect context" and calls add the
	//first time
	return function(x) {
		//counter to know when there is nothing left to apply
		let i = n;
		//the list of arguments that are received
		const xs = [];

		function add(x) {
			//this check lets us work with n = 0
			//although we would never use that for
			//applicatives (or really much at all
			//in FP)
			if (typeof x !== 'undefined') {
				xs.push(x);
				i--;
			}

			//keep "currying" arguments
			if (i) {
				return add;
			}
			//return all the arguments
			else {
				return xs;
			}
		}

		return add(x);
	}
}

/**
 *	all :: Applicative f => [f a] -> f [a]
 *
 *	Collects the results of a list of applicative
 *	actions into a list.
 */
const all = exports.all = function(xs) {
	return xs.slice(1)
		.reduce(
			(acc, x) => acc.app(x),
			xs[0].map(collect(xs.length))
		);
}

/**
 *	replicateM :: Applicative f => (Type f, int, f a) -> f [a]
 *
 *	Repeats the specified action cnt times and collects
 *	the results into a list.
 */
const replicateM = exports.replicateM = function(type, cnt, a) {
	if (cnt <= 0)
		return type.of([]);

	//doing this iteratively so we don't blow the stack
	let acc = a.map(collect(cnt));
	while (--cnt)
		acc = acc.app(a);

	return acc;
}