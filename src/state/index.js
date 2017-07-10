
/**
 *	MonadicJS.State
 *	written by Joel Dentici
 *	on 7/3/2017
 *
 *	The State monad.
 */

class State_ {
	/**
	 *	new :: (s -> [t, s]) -> State s t
	 *
	 *	Constructs a new State_ value.
	 */
	constructor(x) {
		this.x = x;
	}

	/**
	 *	runState :: State s t -> s -> [t, s]
	 *
	 *	Runs the state monad with the provided
	 *	state.
	 */
	runState(s) {
		return this.x(s);
	}

	/**
	 *	bind :: State s a -> (a -> State s b) -> State s b
	 *
	 *	Monadic bind. The result, when ran, will apply
	 *	the function in this State to the provided state
	 *	to get a result and updated state. The provided function
	 *	is applied to the result to get a new State and the function
	 *	in the resulting State is applied to the updated state.
	 *
	 *	Thus, the state is threaded through to the provided function
	 *	as well as the value.
	 */
	bind(k) {
		return State(s => {
			const [r, s2] = this.runState(s);
			return k(r).runState(s2);
		});
	}

	/**
	 *	map :: State s a -> (a -> b) -> State s b
	 *
	 *	Functor map for State.
	 *
	 *	Maps the function over this state by applying
	 *	the provided function to the value inside
	 *	this state, without affecting the current
	 *	state.
	 */
	map(f) {
		return State(s => {
			const [r, s2] = this.runState(s);
			return [f(r), s2];
		})
	}
}

/**
 *	State :: (s -> [a, s]) -> State s a
 *
 *	Constructs a State from a state threading
 *	computation.
 */
const State = module.exports = x => new State_(x);

/**
 *	unit :: a -> State s a
 *
 *	Puts a value into a stateful context.
 *
 *	Does not change the state.
 */
State.unit = x => State(s => [x, s]);

/**
 *	get :: State s s
 *
 *	Returns a new State whose computation
 *	returns the provided state as its value,
 *	and leaves the state unchanged.
 */
State.get = State(s => [s, s]);

/**
 *	put :: s -> State s ()
 *
 *	Returns a new State whose computation
 *	replaces the current state with the
 *	state provided to put.
 */
State.put = s => State(_ => [undefined, s]);

/**
 *	modify :: (s -> s) -> State s ()
 *
 *	Returns a new State whose computation
 *	applies the provided transformation to
 *	the current state and returns that as
 *	the new state.
 */
State.modify = t => State(s => [undefined, t(s)]);