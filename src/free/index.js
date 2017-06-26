'use strict';
const {mapM} = require('../utility.js');

/**
 *	Monadic.Free
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Defines the Free monad over a Functor.
 *
 *	data Free f a = Free (f (Free f a)) | Return a
 */




exports.Free = require('./free.js');
exports.Return = require('./return.js');

/**
 *	unit :: a -> Free f a
 *
 *	Puts a value into the Free monad over
 *	a functor.
 */
exports.unit = exports.Return;

/**
 *	liftF :: f a -> Free f a
 *
 *	Lifts a value in the functor into the Free
 *	monad over that functor.
 */
exports.liftF = a => exports.Free(a.map(exports.Return));

/**
 *	createInterpreter :: Functor[f_0|f_n] => MonadFail m -> [Interpreter[m, f_0|f_n]] -> Free [f_0|f_n] a -> m a
 *
 *	Creates an interpreter that can interpret a "composite" of Free
 *	monads.
 *
 *	A monad with an additional "fail" operation is supplied.
 *
 *	An Interpreter constructor is supplied for each type of Free
 *	monad that this new interpreter will work for.
 */
exports.createInterpreter = function(monad, ...interpreters) {
	const all = ms => mapM(monad, x => x, ms);

	return function(comp) {
		//get an instance of each interpreter
		//is :: [Interpreter]
		const is = interpreters.map(i => i());

		//prepare context for all interpreters, get a monad value
		//for when all are done being prepared
		//ready :: m [()]
		const ready = all(is.map(i => i.prepare()));

		//this function will interpret the free monad
		//in the combined interpretation contexts.
		//execute :: Free [f|0_f|n] a -> m a
		function execute(comp) {
			return comp.case({
				Free: x => {
					//try each interpreter on this
					//value until one works
					for (let i of is) {
						const res = i.map(x);
						if (res) {
							const [v, n] = res;
							if (typeof n === 'function')
								return v.bind(x => execute(n(x)));
							else
								return v.bind(_ => execute(n));
						}
					}

					return monad.fail(new Error(
						"No interpreter provided for " + x.__type__));
				},
				Return: x => monad.unit(x),
			});
		}

		//interpret the free monad to get the result
		//in the monad, after all interpreter contexts
		//are prepared
		//res :: m a
		const res = ready.bind(_ => execute(comp));

		//cleanup each interpreter's context to get an array
		//of results
		//clean :: m [a]
		const clean = all(is.map(i => i.cleanup(res)));

		//it is expected that a successful cleanup will always
		//return the interpretation result, so in the success
		//case, this will return the result
		// :: m a
		return clean.bind(([r1]) => r1);
	}
}