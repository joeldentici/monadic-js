const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const Maybe = require('../src/maybe');
const Utility = require('../src/utility.js');
require('../src/extendArray.js').addExtensions();
require('../src/extendFunction.js').addExtensions();

const {equals} = require('../test-lib.js');


exports.Utility = {
	'when Test': λ.check(
		a => {
			const expected = Maybe.of();
			const result = Utility.when(false, Maybe.of(10));

			const expected2 = Maybe.of(5);
			const result2 = Utility.when(true, Maybe.of(5));

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'unless Test': λ.check(
		a => {
			const expected = Maybe.of(10);
			const result = Utility.unless(false, Maybe.of(10));

			const expected2 = Maybe.of();
			const result2 = Utility.unless(true, Maybe.of(5));

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'guard': λ.check(
		a => {
			const expected = Maybe.Nothing
			const result = Utility.guard(false, Maybe);

			const expected2 = Maybe.of();
			const result2 = Utility.guard(true, Maybe);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'filterM': λ.check(
		a => {
			const expected = Maybe.of([a + 1, a + 2]);
			const result = Utility.filterM(Maybe, x => Maybe.of(x > a))([a, a + 1, a + 2]);

			const expected2 = Maybe.Nothing;
			const result2 = Utility.filterM(Maybe, x => x > a ? Maybe.of(true) : Maybe.Nothing)([a, a + 1, a + 2]);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'mapM': λ.check(
		a => {
			const expected = Maybe.of([a + 1, a + 2, a + 3]);
			const result = Utility.mapM(Maybe, x => Maybe.of(x + 1))([a, a + 1, a + 2]);

			const expected2 = Maybe.Nothing;
			const result2 = Utility.mapM(Maybe, x => x > a ? Maybe.of(a + 1) : Maybe.Nothing)([a, a + 1, a + 2]);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'all': λ.check(
		a => {
			const expected = Maybe.of([a, a + 1]);
			const result = Utility.all(Maybe, [Maybe.of(a), Maybe.of(a + 1)]);

			const expected2 = Maybe.Nothing;
			const result2 = Utility.all(Maybe, [Maybe.of(a), Maybe.Nothing]);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'seqMapM': λ.check(
		a => {
			const expected = Maybe.of([a + 1, a + 2, a + 3]);
			const result = Utility.seqMapM(Maybe, x => Maybe.of(x + 1))([a, a + 1, a + 2]);

			const expected2 = Maybe.Nothing;
			const result2 = Utility.seqMapM(Maybe, x => x > a ? Maybe.of(a + 1) : Maybe.Nothing)([a, a + 1, a + 2]);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'seqAll': λ.check(
		a => {
			const expected = Maybe.of([a, a + 1]);
			const result = Utility.seqAll(Maybe, [Maybe.of(a), Maybe.of(a + 1)]);

			const expected2 = Maybe.Nothing;
			const result2 = Utility.seqAll(Maybe, [Maybe.of(a), Maybe.Nothing]);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'replicateM': λ.check(
		a => {
			const expected = Maybe.of([a, a, a, a, a]);
			const result = Utility.replicateM(Maybe, 5, Maybe.of(a));

			const expected2 = Maybe.Nothing;
			const result2 = Utility.replicateM(Maybe, 5, Maybe.Nothing);

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'caseOf': λ.check(
		a => {
			const o = (x, t) => ({x, __type__: t});
			const o2 = (x, t) => ({x, constructor: {name: t}});
			const o3 = (x, t) => ({x, __type__: t, doCase(f) {return f(this.x)}});

			const expected = a;
			const result = Utility.caseOf(o(a, 'blah'), {
				'blah': x => x.x,
			});

			const expected2 = a;
			const result2 = Utility.caseOf(o2(a, 'blah'), {
				'blah': x => x.x,
			});

			const expected3 = a;
			const result3 = Utility.caseOf(o3(a, 'blah'), {
				'blah': x => x,
			});

			const expected4 = 5;
			const result4 = Utility.caseOf(o(a, 'blah'), {
				default: _ => 5,
			});

			let test5 = false;
			try {
				Utility.caseOf(o(a, 'blah'), {});
			}
			catch (e) {
				test5 = e.constructor.name === 'CaseAnalysisError';
			}

			return equals(result, expected) && equals(result2, expected2)
			 && equals(result3, expected3) && equals(result4, expected4)
			 && equals(true, test5);
		},
		[Number]
	),
	'zip': λ.check(
		(a, b, c, d) => {
			const expected = [[a,c],[b,d]];
			const result = Utility.zip([a,b], [c,d]);

			const expected2 = [[a,d]];
			const result2 = Utility.zip([a,b,c], [d]);

			const expected3 = [[a,b]];
			const result3 = Utility.zip([a], [b,c,d]);

			const expected4 = [];
			const result4 = Utility.zip([a], []);

			const expected5 = [];
			const result5 = Utility.zip([], [a]);

			const expected6 = [];
			const result6 = Utility.zip([], []);

			return equals(result, expected) && equals(result2, expected2)
			 && equals(result3, expected3) && equals(result4, expected4)
			 && equals(result5, expected5) && equals(result6, expected6);
		},
		[Number, Number, Number, Number]
	)
};