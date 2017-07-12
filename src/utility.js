'use strict';

/**
 *	Monadic.Utility
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Utility functions for working with monads.
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

//TODO: This should be aliased to traverse for Traversables
//once the Traversable and Foldable definitions are ready
/**
 *	mapM :: Monad m => Type m -> (a -> m b) -> [a] -> m [b]
 *
 *	Maps a monadic function over a list of values, sequencing each
 *	application over the list, and collecting the results into a new
 *	list, which is lifted into the monadic type provided.
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
/*
		return doM(function*() {
			const fst = yield fn(lst[0]);
			const rest = yield mapM(monad, fn, lst.slice(1));
			return monad.unit([fst].concat(rest));
		});*/
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