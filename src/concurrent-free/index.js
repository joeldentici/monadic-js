const CaseClass = require('js-helpers').CaseClass;
/**
 *	MonadicJS.ConcurrentFree
 *	written by Joel Dentici
 *	on 7/19/2017
 *
 *	Free monads over any algebraic data type
 *	that preserve concurrent semantics of Applicative
 *	and Functor during interpretation.
 */

class Free extends CaseClass {
	constructor() {
		super();
	}

	/**
	 *	map :: Free f a -> (a -> b) -> Free f b
	 *
	 *	Maps a function over the value in the
	 *	Free monad.
	 */
	map(f) {
		return this.case({
			Pure: a => Free.Pure(f(a)),
			Lift: (x, g) => Free.Lift(x)(c(f, g)),
			Ap: (x, y) => Free.Ap(x)(y.map(a => a.map(f))),
			Join: x => Free.Join(x.map(a => a.map(f))),
		});
	}

	/**
	 *	app :: Free f (a -> b) -> Free f a -> Free f b
	 *
	 *	Applicative application of a function in a
	 *	Free monad to a value in a Free monad.
	 */
	app(o) {
		return this.case({
			Pure: f => o.map(f),
			default: _ => Free.Ap(o)(this),
		});
	}

	/**
	 *	ap :: Free f a -> Free f (a -> b) -> Free f b
	 *
	 *	Reversed arguments of app.
	 */
	ap(f) {
		return f.app(this);
	}

	/**
	 *	seqL :: Free f a -> Free f b -> Free f a
	 *
	 *	Applicative sequencing from left-to-right,
	 *	keeping the left value.
	 */
	seqL(o) {
		return this.map(x => y => x).app(o);
	}

	/**
	 *	seqR :: Free f a -> Free f b -> Free f b
	 *
	 *	Applicative sequencing from left-to-right,
	 *	keeping the right value.
	 */
	seqR(o) {
		return this.map(x => y => y).app(o);
	}

	/**
	 *	chain :: Free f a -> (a -> Free f b) -> Free f b
	 *
	 *	Monadic chaining/binding of a value in a Free
	 *	monad to a function that returns a Free monad.
	 */
	chain(f) {
		return this.case({
			Pure: x => f(x),
			default: _ => Free.Join(this.map(f)),
		});
	}

	/**
	 *	foldConcurrent :: Monad m => Free f a -> (Type m, (forall x. f x -> m (m x))) -> m a
	 *
	 *	Interpret this Free monad into the specified monad
	 *	using the specified transformation.
	 */
	foldConcurrent(m, t) {
		return this.case({
			Pure: x => m.of(x),
			Lift: (x, g) => t(x).map(g),
			Ap: (x, y) => y.foldConcurrent(m, t).app(x.foldConcurrent(m, t)),
			Join: x => x.foldConcurrent(m, t).chain(y => y.foldConcurrent(m, t)),
		});
	}

	/**
	 *	alt :: Free f a -> Free f b -> Free f (a | b)
	 *
	 *	Alternative composition. During interpretation, we
	 *	attempt to interpret this Free Monad. If that results
	 *	in an error, we interpret the specified Free Monad instead.
	 *
	 *	You must include Control.interpreter in your interpreter
	 *	list to use this, or you will get an error at runtime.
	 */
	alt(o) {
		return tryF(this).catch(e => o);
	}
}

class Pure extends Free {
	constructor(a) {
		super();
		this.a = a;
	}

	doCase(fn) {
		return fn(this.a);
	}
}

class Lift extends Free {
	constructor(v, t) {
		super();
		this.v = v;
		this.t = t;
	}

	doCase(fn) {
		return fn(this.v, this.t);
	}
}

class Ap extends Free {
	constructor(fv, ft) {
		super();
		this.fv = fv;
		this.ft = ft;
	}

	doCase(fn) {
		return fn(this.fv, this.ft);
	}
}

class Join extends Free {
	constructor(ffv) {
		super();
		this.ffv = ffv;
	}

	doCase(fn) {
		return fn(this.ffv);
	}
}

Free.Pure = x => new Pure(x);
Free.Lift = v => t => new Lift(v, t);
Free.Ap = fv => ft => new Ap(fv, ft);
Free.Join = fvv => new Join(fvv);

/**
 *	unit/of :: a -> Free f a
 *
 *	Put a pure value into Free f context
 */
Free.of = Free.unit = Free.Pure;

/**
 *	liftF :: f a -> Free f a
 *
 *	Put a value in f context into
 *	a Free f context
 */
Free.liftF = x => Free.Lift(x)(x => x);

function c(g, f) {
	return x => g(f(x));
}

/**
 *	foldConcurrent :: Monad m => Type m -> (forall x. f x -> m (m x)) -> Free f a -> m a
 *
 *	Interpret a Free monad over f using a transformation from
 *	f to m m, where m is the monad we are interpreting into.
 */
Free.foldConcurrent = m => t => fv => fv.foldConcurrent(m, t);

class InterpreterError extends Error {

}

/**
 *	combineTransformations :: Monad m => forall a. [f a -> m (m a)] -> (f a -> m (m a))
 *
 *	Combines a list of transformations into a single transformation.
 *
 *	In order for this to work, each transformation must return an undefined
 *	result for any (f a) it cannot handle. This is easily accomplished with
 *	default: constant(undefined) or default: _ => undefined or default: _ => {}
 *	in the type case analysis.
 *
 *	If no transformation exists for a value, then an InterpreterError is thrown.
 */
Free.combineTransformations = ts => ts.reduce(
	(acc, t) => x => {
		const v = t(x);
		if (typeof v === 'undefined')
			return acc(x);
		else
			return v;
	},
	x => {
		throw new InterpreterError('No transformation for', x);
	}
);

/**
 *	Interpreter :: Object
 *
 *	An Interpreter is an object satsifying the following interface:
 *
 *	<code>.setup :: MonadFail m => () -> m e ()</code> Perform actions prior to interpretation
 *
 *	<code>.transform :: MonadFail m => (f x, f x -> m e x) -> m e x</code> Transform an ADT to a monadic action.
 *	The second argument to transform contains all transformations and can be used with foldConcurrent to interpret
 *	"sub-statements".
 *
 *	<code>.cleanupSuccess :: MonadFail m => x -> m e ()</code> Perform cleanup after successful interpretation
 *
 *	<code>.cleanupFail :: MonadFail => e -> m (e | e2) ()</code> Performs cleanup after failed interpretation
 *
 *	This is the preferred interface, instead of just providing a transformation.
 */

/**
 *	interpret :: MonadFail m, All m => (Type m, ...Interpreter) -> Free f a -> m e a
 *
 *	Interprets a Free monad using multiple interpreters, typically
 *	one for each ADT that is summed into f, into the specified
 *	monad.
 *
 *	Each interpreter can run setup and cleanup actions. Two cleanup methods
 *	are required: one for a normal case and one for an error case. If either
 *	cleanup method itself fails, then the error for that is returned. If only
 *	the transformation fails, then the error for that is returned.
 *
 *	The monad being interpreted into must be a MonadFail and All, meaning it
 *	should provide a fail method for errors, a chainFail method to catch errors,
 *	and an all method to sequence a list of actions.
 */
Free.interpret = (m, ...interpreterCs) => x => {
	//construct instance of each interpreter
	const interpreters = interpreterCs.map(i => i());

	//pre-interpretation actions for each interpreter
	const setup = () => m.all(interpreters.map(i => i.setup()));

	//cleanup actions
	const goodCleanup = v => m.all(interpreters.map(i => i.cleanupSuccess(v)));
	const failCleanup = e => m.all(interpreters.map(i => i.cleanupFail(e)));

	//combine all transformations into one transformation
	const transformations = Free.combineTransformations(
		interpreters.map(i => x => i.transform(x, transformations))
	);

	const res = setup() //perform setup actions
	//transform Free monad
	     .chain(_ => x.foldConcurrent(m, transformations))
	//cleanup in case of an error
	     .chainFail(e => failCleanup(e)
	     //if cleanup succeeds, propagate original error
	        .chain(_ => m.fail(e)))
	//cleanup in case of success
	     .chain(v => goodCleanup(v).map(_ => v));

	return res;
}

module.exports = Free;

const {tryF, throwE} = require('./control.js');

/**
 *	empty :: Free f ()
 *
 *	A Free Monad with no value. Uses the control
 *	primitive throwE to ensure that chained functions
 *	will not be applied, thus satsifying <code>empty >>= f = empty</code>.
 */
Free.empty = throwE();

/**
 *	zero :: () -> Free f ()
 *
 *	Returns Free.empty
 */
Free.zero = () => Free.empty;