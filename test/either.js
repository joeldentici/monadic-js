const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity} = require('fantasy-combinators');
const Either = require('../src/either');

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
Either.of('').constructor.prototype.ap = Either.of('').constructor.prototype.app;
Either.Left('').constructor.prototype.ap = Either.Left('').constructor.prototype.app;

const {equals} = require('../test-lib.js');

exports.Either = {
	'Applicative': applicative.laws(λ)(Either, identity),
	'Identity (Applicative)': applicative.identity(λ)(Either, identity),
	'Composition (Applicative)': applicative.composition(λ)(Either, identity),
	'Homomorphism (Applicative)': applicative.homomorphism(λ)(Either, identity),
	'Interchange (Applicative)': applicative.interchange(λ)(Either, identity),

	'Functor': functor.laws(λ)(Either.of, identity),
	'Identity (Functor)': functor.identity(λ)(Either.of, identity),
	'Composition (Functor)': functor.composition(λ)(Either.of, identity),


	'Monad': monad.laws(λ)(Either, identity),
	'Left Identity (Monad)': monad.leftIdentity(λ)(Either, identity),
	'Right Identity (Monad)': monad.rightIdentity(λ)(Either, identity),
	'Associativity (Monad)': monad.associativity(λ)(Either, identity),

	'Right maps correctly': λ.check(
		a => {
			const fn = x => x * 0;
			const expected = Either.of(a * 0);
			const result = Either.of(a).map(fn);

			return equals(result, expected);
		},
		[Number]
	),
	'Left maps correctly': λ.check(
		a => {
			const fn = x => x * 0;
			const expected = Either.Left(a);
			const result = Either.Left(a).map(fn);

			return equals(result, expected);
		},
		[Number]
	),
	'Right chains correctly': λ.check(
		a => {
			const fn = x => Either.of(a * 0);
			const fn2 = x => Either.Left(10);

			const expected = Either.of(a * 0);
			const result = Either.of(a).chain(fn);

			const expected2 = Either.Left(10);
			const result2 = Either.of(a).chain(fn2);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'Left chains correctly': λ.check(
		a => {
			const fn = x => Maybe.of(a * 0);

			const expected = Either.Left(a);
			const result = Either.Left(a).chain(fn);

			return equals(result, expected);
		},
		[Number]
	),
}