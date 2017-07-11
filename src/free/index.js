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
 *	unit/of :: a -> Free f a
 *
 *	Puts a value into the Free monad over
 *	a functor.
 */
exports.of = exports.unit = exports.Return;

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
		const is = interpreters.map(i => i(execute));

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
							else if (typeof n === 'object' && n)
								return v.bind(_ => execute(n));
							else
								return v;
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
		const clean = monad.try(
				//cleanup all interpreters, and return the result
				res.bind(r => all(is.map(i => i.cleanup(r)))
							  .map(_ => r))
			)
			//cleanup all interpreters and return the error
			.catch(e => all(is.map(i => i.cleanupErr(e)))
						.bind(_ => monad.fail(e)));

		//this will contain the result if everything was successful,
		//otherwise an error describing what went wrong.
		return clean;
	}
}