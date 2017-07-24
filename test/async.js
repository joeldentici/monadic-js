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


	/* Test Async structure */
	'Map Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a + 5));
			const result = runAsync(Async.of(a).map(x => x + 5));

			const expected2 = runAsync(Async.fail("err"));
			const result2 = runAsync(Async.fail('err').map(x => a));

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'Map Fail Test': λ.check(
		a => {
			const expected = runAsync(Async.fail(a + 5));
			const result = runAsync(Async.fail(a).mapFail(x => x + 5));

			const expected2 = runAsync(Async.of(a));
			const result2 = runAsync(Async.of(a).mapFail(x => x + 5));

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'Chain Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a + 5));
			const result = runAsync(Async.of(a).chain(x => Async.of(x + 5)));

			const expected2 = runAsync(Async.fail("err"));
			const result2 = runAsync(Async.of(a).chain(x => Async.fail('err')));

			const expected3 = runAsync(Async.fail("err"));
			const result3 = runAsync(Async.fail("err").chain(x => Async.of(a)));

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		},
		[Number]
	),
	'Chain Fail Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a));
			const result = runAsync(Async.of(a).chainFail(x => Async.of(x + 5)));

			const expected2 = runAsync(Async.fail("err"));
			const result2 = runAsync(Async.fail(a).chainFail(x => Async.fail('err')));

			const expected3 = runAsync(Async.of(a));
			const result3 = runAsync(Async.fail("err").chainFail(x => Async.of(a)));

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		},
		[Number]
	),
	'SeqL Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a));
			const result = runAsync(Async.of(a).seqL(Async.of(5)));

			const expected2 = runAsync(Async.fail("err"));
			const result2 = runAsync(Async.of(a).seqL(Async.fail("err")));

			const expected3 = runAsync(Async.fail("err"));
			const result3 = runAsync(Async.fail("err").seqL(Async.of(a)));


			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		},
		[Number]
	),
	'SeqR Test': λ.check(
		a => {
			const expected = runAsync(Async.of(5));
			const result = runAsync(Async.of(a).seqR(Async.of(5)));

			const expected2 = runAsync(Async.fail("err"));
			const result2 = runAsync(Async.of(a).seqR(Async.fail("err")));

			const expected3 = runAsync(Async.fail("err"));
			const result3 = runAsync(Async.fail("err").seqR(Async.of(a)));


			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		},
		[Number]
	),
	'App Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a + 5));
			const result = runAsync(Async.of(x => y => x + y).app(Async.of(a)).app(Async.of(5)));

			const expected2 = runAsync(Async.fail("err"));
			const result2 = runAsync(Async.of(x => y => x + y).app(Async.of(a)).app(Async.fail("err")));

			const expected3 = runAsync(Async.fail("err"));
			const result3 = runAsync(Async.of(x => y => x + y).app(Async.fail("err")).app(Async.of(a)));

			const expected4 = runAsync(Async.fail("err"));
			const result4 = runAsync(Async.fail("err").app(Async.of(a)).app(Async.of(5)));

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3) && equals(result4, expected4);
		},
		[Number]
	),
	'Alt Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a));
			const result = runAsync(Async.of(a).alt(Async.of(5)));

			const expected2 = runAsync(Async.of(a));
			const result2 = runAsync(Async.fail("err").alt(Async.of(a)));

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'tap Test': λ.check(
		a => {
			const expected = runAsync(Async.of(a));
			const result = runAsync(Async.of(a).tap(x => x + 7));

			return equals(result, expected);
		},
		[Number]
	),
	'tap fail Test': λ.check(
		a => {
			const expected = runAsync(Async.fail(a));
			const result = runAsync(Async.fail(a).tapFail(x => x + 7));

			return equals(result, expected);
		},
		[Number]
	),
};