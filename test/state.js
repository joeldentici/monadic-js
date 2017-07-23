const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity} = require('fantasy-combinators');
const State = require('../src/state');

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
State.of('').constructor.prototype.ap = State.of('').constructor.prototype.app;

const {equals} = require('../test-lib.js');

const state = [];
const runState = x => x.runState(state);

exports.State = {
	'Applicative': applicative.laws(λ)(State, runState),
	'Identity (Applicative)': applicative.identity(λ)(State, runState),
	'Composition (Applicative)': applicative.composition(λ)(State, runState),
	'Homomorphism (Applicative)': applicative.homomorphism(λ)(State, runState),
	'Interchange (Applicative)': applicative.interchange(λ)(State, runState),

	'Functor': functor.laws(λ)(State.of, runState),
	'Identity (Functor)': functor.identity(λ)(State.of, runState),
	'Composition (Functor)': functor.composition(λ)(State.of, runState),


	'Monad': monad.laws(λ)(State, runState),
	'Left Identity (Monad)': monad.leftIdentity(λ)(State, runState),
	'Right Identity (Monad)': monad.rightIdentity(λ)(State, runState),
	'Associativity (Monad)': monad.associativity(λ)(State, runState),

	'State threads correctly + Modify works': λ.check(
		(a, b) => {
			const addVal = x => State.modify(s => s.concat('extra')).map(_ => x);

			const [val, out] = State.of(a).chain(addVal).runState(b);

			return equals(val, a) && equals(out, b.concat('extra'));
		},
		[Number, Array]
	),
	'Get works': λ.check(
		(a, b) => {
			const [val, out] = State.of(a).chain(_ => State.get).runState(b);

			return equals(val, b) && equals(out, b);
		},
		[Number, Array]
	),
	'Put works': λ.check(
		(a, b) => {
			const [val, out] = State.of(a).chain(_ => State.put([])).runState(b);

			return equals(val, undefined) && equals(out, []);
		},
		[Number, Array]
	),
}