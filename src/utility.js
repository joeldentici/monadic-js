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
 *	mapM :: Monad m => Type m -> (a -> m b) -> [a] -> m [b]
 *
 *	Maps a monadic function over a list of values, sequencing each
 *	application over the list, and collecting the results into a new
 *	list, which is lifted into the monadic type provided.
 *
 *	TODO: Replace usages of this with _mapM, then rename
 *	_mapM to mapM and delete this function.
 */
const mapM = exports.mapM = function(monad, fn, lst) {
	if (lst.length === 0) {
		return monad.unit([]);
	}
	else {
		return fn(lst[0]).bind(x =>
			mapM(monad, fn, lst.slice(1)).map(xs =>
				[x].concat(xs)
			)
		);
	}
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
 *	filterM :: Consable t, Monad m => (Type m, (a -> m bool)) -> t a -> m (t a)
 *
 *	Filters a specified list by using a predicate with results
 *	in the specified monad. Returns the filtered list in the
 *	specified monad.
 */
const filterM = exports.filterM = (monad, predM) => xs => {
	const t = xs.constructor;

	const z0 = t.empty;

	return foldlM(monad, (acc, v) => {
		return predM(v)
			.map(b => b ? t.append(v, acc) : acc);
	})(z0)(xs);
}

/**
 *	_mapM :: Consable t, Monad m => (Type m, (a -> m b)) -> t a -> m (t b)
 *
 *	mapM defined to work over any Consable structure.
 *
 *	We can alternatively define it as traverse on a
 *	Traversable structure (Foldable + Functor).
 */
const _mapM = exports._mapM = (monad, f) => xs => {
	const t = xs.constructor;

	const z0 = t.empty;

	return foldlM(monad, (acc, v) => {
		return f(v)
			.map(v2 => t.append(v2, acc));
	})(z0)(xs);
}