const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const Async = require('../src/async');
const AsyncComputation = require('../src/async/asynccomputation.js');
//for testing, we will schedule computations to actually run immediately!
AsyncComputation.schedule = x => x();

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
Async.of('').constructor.prototype.ap = Async.of('').constructor.prototype.app;

const {equals} = require('../test-lib.js');

function runAsync(comp) {
	return comp.fork(identity, identity);
}

exports.Async = {
	'Applicative': applicative.laws(λ)(Async, runAsync),
	'Identity (Applicative)': applicative.identity(λ)(Async, runAsync),
	'Composition (Applicative)': applicative.composition(λ)(Async, runAsync),
	'Homomorphism (Applicative)': applicative.homomorphism(λ)(Async, runAsync),
	'Interchange (Applicative)': applicative.interchange(λ)(Async, runAsync),

	'Functor': functor.laws(λ)(Async.of, runAsync),
	'Identity (Functor)': functor.identity(λ)(Async.of, runAsync),
	'Composition (Functor)': functor.composition(λ)(Async.of, runAsync),


	'Monad': monad.laws(λ)(Async, runAsync),
	'Left Identity (Monad)': monad.leftIdentity(λ)(Async, runAsync),
	'Right Identity (Monad)': monad.rightIdentity(λ)(Async, runAsync),
	'Associativity (Monad)': monad.associativity(λ)(Async, runAsync),


	/* Todo: Test other methods, error handling, etc. */

};