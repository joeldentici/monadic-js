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

/**
 *	mapM :: Monad m => Type m -> (a -> m b) -> [a] -> m [b]
 *
 *	Maps a monadic function over a list of values, sequencing each
 *	application over the list, and collecting the results into a new
 *	list, which is lifted into the monadic type provided.
 */
exports.mapM = function(monad, fn, lst) {
	if (lst.length === 0) {
		return monad.unit([]);
	}
	else {
		return doM(function*() {
			const fst = yield fn(lst[0]);
			const rest = yield mapM(monad, fn, lst.slice(1));
			return monad.unit([fst].concat(rest));
		});
	}
}