const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity} = require('fantasy-combinators');
const Either = require('../src/either');

exports.Either = {
/*	'Applicative': applicative.laws(λ)(Either, identity),
	'Identity (Applicative)': applicative.identity(λ)(Either, identity)
	'Composition (Applicative)': applicative.composition(λ)(Either, identity),
	'Homomorphism (Applicative)': applicative.homomorphism(λ)(Either, identity),
	'Interchange (Applicative)': applicative.interchange(λ)(Either, identity),
*/
	'Functor': functor.laws(λ)(Either.of, identity),
	'Identity (Functor)': functor.identity(λ)(Either.of, identity),
	'Composition (Functor)': functor.composition(λ)(Either.of, identity),


	'Monad': monad.laws(λ)(Either, identity),
	'Left Identity (Monad)': monad.leftIdentity(λ)(Either, identity),
	'Right Identity (Monad)': monad.rightIdentity(λ)(Either, identity),
	'Associativity (Monad)': monad.associativity(λ)(Either, identity),
}