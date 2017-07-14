'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Async.AsyncHandler
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds an AsyncComputation and a handler
 *	for a failed computation.
 */
class AsyncHandler extends CaseClass {
	constructor(asyncVal, handler, continuation) {
		super('AsyncHandler');
		this.val = asyncVal;
		this.handler = handler;
		this.continuation = continuation;
	}

	map(fn) {
		return new AsyncHandler(
			this.val, this.handler, x => fn(this.continuation(x)));
	}

	doCase(fn) {
		return fn(this.val, this.handler, this.continuation);
	}
}
module.exports = AsyncHandler;

'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Async.AsyncFirst
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds a set of AsyncComputations.
 */
class AsyncFirst extends CaseClass {
	constructor(comps, continuation) {
		super('AsyncFirst');
		this.comps = comps;
		this.continuation = continuation;
	}

	map(fn) {
		return new AsyncFirst(
			this.comps, x => fn(this.continuation(x)));
	}

	doCase(fn) {
		return fn(this.comps, this.continuation);
	}
}
module.exports = AsyncFirst;

'use strict';
const CaseClass = require('js-helpers').CaseClass;

/**
 *	Monadic.Async.AsyncComputation
 *	written by Joel Dentici
 *	on 6/25/2017
 *
 *	Holds a thunked computation.
 */
class AsyncComputation extends CaseClass {
	constructor(thunk, continuation) {
		super('AsyncComputation');
		this.thunk = thunk;
		this.continuation = continuation;
	}

	map(fn) {
		return new AsyncComputation(
			this.thunk, x => fn(this.continuation(x)));
	}

	doCase(fn) {
		return fn(this.thunk, this.continuation);
	}
}
module.exports = AsyncComputation;

/* TODO: We need to create instructions for the new Operational monad that
will replace Free that at least perform error handling. We might want some
primitives for racing and other stuff like that. But we will be getting rid
of what is below. It currently won't work because we redefined Async as its
own monad/applicative/alternative/functor. */

/* The Async interpreter doesn't do anything,
it just exists so Async can be used with other
Free monads. It literally maps Asyncs back onto Asyncs.

Other Free monads will provide interpreters to map to
Async as well
*/
Async.interpreter = (execute) => ({
	/**
	 *	prepare :: Interpreter -> () -> Async ()
	 *
	 *	Prepares interpretation context for Async.
	 */
	prepare() {
		return Async.unit();
	},

	/**
	 *	map :: Interpreter -> AsyncFunctor b a -> [Async b a, (a -> Free f a | Free f a)]
	 *
	 *	Maps an AsyncComputation into a new Async, essentially doing
	 *	nothing.
	 */
	map(comp) {
		return comp.case({
			AsyncComputation: (t, n) => [Async.create(t), n],
			AsyncHandler: (a, h, n) => [Async.catch(execute(a), h), n],
			AsyncFirst: (cs, n) => [Async.first(cs.map(execute)), n],
			default: () => null,
		});
	},

	/**
	 *	cleanup :: Interpreter -> a -> Async () ()
	 *
	 *	We don't need to clean up anything.
	 */
	cleanup(result) {
		return Async.unit();
	},

	/**
	 *	cleanupErr :: Interpreter -> b -> Async () ()
	 *
	 *	We don't need to clean up anything.
	 */
	cleanupErr(err) {
		return Async.unit();
	}
});