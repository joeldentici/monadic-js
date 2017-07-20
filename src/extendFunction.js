
/**
 *	MonadicJS.FunctionExtensions
 *	written by Joel Dentici
 *	on 7/19/2017
 *
 *	Makes Function compatible with this library.
 *
 *	WARNING: This modifies the Function prototype
 *	so you should always unload it when done. You
 *	may still mess other code up if you use these
 *	extensions in an asynchronous section of code.
 *
 *	NOTE: Using the do-notation/expr language extension
 *	will automatically load these extensions. That is because
 *	they include kleisi composition, which it provides an operator
 *	for.
 */

const oldPrototype = {};

const newPrototype = {
	/**
	 *	map :: (a -> b) -> (b -> c) -> a -> c
	 *
	 *	Sequencing of functions.
	 *
	 *	The Haskell definition is composition of functions
	 *	but we define map with its arguments backwards for
	 *	all our Functors so it can live on the object, which
	 *	means out map = flip haskellmap = sequence
	 */
	map: function(f) {
		return x => f(this(x));
	},
	/**
	 *	chain :: (a -> b) -> (b -> (a -> c)) -> a -> c
	 */
	chain: function(f) {
		return x => f(this(x))(x);
	},
	/**
	 *	arrow :: Monad m => (a -> m b) -> (b -> m c) -> a -> m c
	 *
	 *	Left-to-right Kleisi composition of monadic functions.
	 */
	arrow: function(f) {
		return x => this(x).chain(f);
	},
	/**
	 *	alt :: Alternative f => (a -> f b) -> (a -> f c) -> a -> f (b | c)
	 *
	 *	This lifts the alternative combinator for an Alternative to
	 *	work on alternative returning functions. Note that this will
	 *	always evaluate both functions to use the alternative instance
	 *	of their return values. As long as your alternative is side-effect
	 *	free, this won't cause any problems. If it is not and those side-effects
	 *	are critical (ie, not console.logs or something similar), you might
	 *	wind up with corrupt data somewhere.
	 */
	alt: function(f) {
		return x => this(x).alt(f(x));
	}
}
newPrototype.sequence = newPrototype.map;

const oldConstructor = {};

const newConstructor = {
	of: function(a) {
		return x => a;
	}
}
newConstructor.unit = newConstructor.of;

function addExtensions() {
	Object.keys(newPrototype).forEach(k => {
		oldPrototype[k] = Function.prototype[k];
		Function.prototype[k] = newPrototype[k];
	});

	Object.keys(newConstructor).forEach(k => {
		newConstructor[k] = Function[k];
		Function[k] = newConstructor[k];
	});
}

function removeExtensions() {
	Object.keys(oldPrototype).forEach(k => {
		Function.prototype[k] = oldPrototype[k];
	});

	Object.keys(oldConstructor).forEach(k => {
		Function[k] = oldConstructor[k];
	});
}

function useExtensions(f) {
	addExtensions();
	const res = f();
	removeExtensions();
	return res;
}

module.exports = {
	addExtensions,
	removeExtensions,
	useExtensions
};