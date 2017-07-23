const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const Maybe = require('../src/maybe');

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
Maybe.of('').constructor.prototype.ap = Maybe.of('').constructor.prototype.app;

const {equals} = require('../test-lib.js');

exports.Maybe = {
	'Applicative': applicative.laws(λ)(Maybe, identity),
	'Identity (Applicative)': applicative.identity(λ)(Maybe, identity),
	'Composition (Applicative)': applicative.composition(λ)(Maybe, identity),
	'Homomorphism (Applicative)': applicative.homomorphism(λ)(Maybe, identity),
	'Interchange (Applicative)': applicative.interchange(λ)(Maybe, identity),

	'Functor': functor.laws(λ)(Maybe.of, identity),
	'Identity (Functor)': functor.identity(λ)(Maybe.of, identity),
	'Composition (Functor)': functor.composition(λ)(Maybe.of, identity),


	'Monad': monad.laws(λ)(Maybe, identity),
	'Left Identity (Monad)': monad.leftIdentity(λ)(Maybe, identity),
	'Right Identity (Monad)': monad.rightIdentity(λ)(Maybe, identity),
	'Associativity (Monad)': monad.associativity(λ)(Maybe, identity),

	'Just maps correctly': λ.check(
		a => {
			const fn = x => x * 0;
			const expected = Maybe.of(a * 0);
			const result = Maybe.of(a).map(fn);

			return equals(result, expected);
		},
		[Number]
	),
	'Nothing maps correctly': λ.check(
		a => {
			const fn = x => x * 0;
			const expected = Maybe.Nothing;
			const result = Maybe.Nothing.map(fn);

			return equals(result, expected);
		},
		[Number]
	),
	'Just chains correctly': λ.check(
		a => {
			const fn = x => Maybe.of(a * 0);
			const fn2 = x => Maybe.Nothing;

			const expected = Maybe.of(a * 0);
			const result = Maybe.of(a).chain(fn);

			const expected2 = Maybe.Nothing;
			const result2 = Maybe.of(a).chain(fn2);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'Nothing chains correctly': λ.check(
		a => {
			const fn = x => Maybe.of(a * 0);

			const expected = Maybe.Nothing;
			const result = Maybe.Nothing.chain(fn);

			return equals(result, expected);
		},
		[Number]
	),
}