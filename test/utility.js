const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const Maybe = require('../src/maybe');
const Utility = require('../src/utility.js');
const Async = require('../src/async');
require('../src/extendArray.js').addExtensions();
const funcExt = require('../src/extendFunction.js');
funcExt.addExtensions();
funcExt.removeExtensions();
funcExt.useExtensions(x => x);
funcExt.addExtensions();

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
	),
	'const': λ.check(
		(a, b) => {
			return equals(Utility.constant(a)(b), a) && equals(Function.of(a)(b), a);
		},
		[Number, Number]
	),
	'folds': λ.check(
		a => {
			const expected = Maybe.of([a, a + 1, a + 2]);

			const append = (l,v) => Maybe.of(l.concat(v));
			const append2 = (v,l) => append(l,v);

			const result = Utility.foldlM(Maybe, append)([])([a, a + 1, a + 2]);
			const result2 = Utility.foldrM(Maybe, append2)([])([a, a + 1, a + 2]);


			return equals(result, expected) && equals(result2, expected);
		},
		[Number]
	),
	'doM': λ.check(
		(a,b,c) => {
			const expected = Maybe.of(a + b + c);

			const result = Utility.doM(function*() {
				const x = yield Maybe.of(a);
				const y = yield Maybe.of(b);
				const z = yield Maybe.of(c);

				return Maybe.of(x + y + z);
			})

			return equals(result, expected);
		},
		[Number, Number, Number]
	),
	'kleisi': λ.check(
		a => {
			const expected = Maybe.of(a / 2 + 1);
			const half = x => Maybe.of(x / 2);
			const plus = x => Maybe.of(x + 1);

			const fn = half.arrow(plus);

			const result = Maybe.of(a).chain(fn);

			return equals(result, expected);
		},
		[Number]
	),
	'seq: (-> r).map': λ.check(
		a => {
			const half = x => x / 2;
			const plus = x => x + 1;

			const fn = half.map(plus);

			return equals(fn(a), a / 2 + 1);
		},
		[Number]
	),
	'chain: (-> r).chain': λ.check(
		a => {
			const half = x => x / 2;
			const plus = x => x + 1;

			const orig = x => x * 5;

			const chained = x => x > 1 ? half : plus;

			const fn = orig.chain(chained);

			return equals(fn(a), a * 5 > 1 ? half(a) : plus(a));
		},
		[Number]
	),
	'alt': λ.check(
		a => {
			const f1 = x => Maybe.of(x);
			const f2 = x => Maybe.Nothing;

			const f3 = f1.alt(f2);
			const f4 = f2.alt(f2);

			return equals(f3(a), Maybe.of(a)) && equals(f4(a), Maybe.Nothing);
		},
		[Number]
	),
	'[].chain': λ.check(
		() => {
			const xs = [1,2,3];
			const f = x => [x + 1, x + 2];
			const expected = [2,3,3,4,4,5];

			const result = xs.chain(f);

			return equals(result, expected);
		},
		[]
	),
	'[].app': λ.check(
		() => {
			const xs = [1,2,3];
			const f = [x => x + 1, x => x * 2]
			const expected = [2,3,4,2,4,6];

			const result = f.app(xs);
			const result2 = xs.ap(f);

			return equals(result, expected) && equals(result2, expected);
		},
		[]
	),
	'[].seqL/R': λ.check(
		() => {
			const xs = [1,2,3];
			const ys = [3,4,5];
			const expected = [1,1,1,2,2,2,3,3,3];
			const expected2 = [3,4,5,3,4,5,3,4,5];

			const result = xs.seqL(ys);
			const result2 = xs.seqR(ys);

			return equals(result, expected) && equals(result2, expected2);
		},
		[]
	),
	'[].alt': λ.check(
		() => {
			const xs = [1,2,3];
			const ys = [3,4,5];
			const expected = [1,2,3,3,4,5];

			const result = xs.alt(ys);

			return equals(result, expected);
		},
		[]
	),
	'Array.of/zero/append': λ.check(
		() => {
			const result = Array.of(1);
			const expected = [1];

			const result2 = Array.zero();
			const expected2 = [];

			const result3 = Array.append(1, [1,2]);
			const expected3 = [1,2,1];

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		},
		[]
	),
	'forever': test => {
		let times = 0;

		const comp = Async.create((succ, fail) => {
			if (times < 10) {
				times++;
				succ(times);
			}
			else
				fail(times);
		});

		Utility.forever(comp).fork(x => {
			test.ok(false, "comp should have failed");
			test.done();
		}, e => {
			test.equals(e, 10, "Should have run 10 times");
			test.done();
		});
	},
	'liftMaybe/exists': test => {
		const f = a => a > 5 ? Maybe.Just(a) : Maybe.Nothing;

		const fA = Utility.liftMaybe(Async, f);

		const a1 = Utility.resume(fA(3));
		const a2 = Utility.resume(fA(6));

		const a3 = Utility.resume(Utility.exists(Async.of(Maybe.Nothing)));
		const a4 = Utility.resume(Utility.exists(Async.of(Maybe.Just(7))));

		const aas = Async.all(a1, a2, a3, a4);

		aas.fork(x => {
			test.ok(equals(x, [undefined, 6, undefined, 7]));
			test.done();
		}, e => {
			console.error(e);
			test.ok(false, e);
			test.done();
		});
	},
	'retry': test => {
		const f = a => Async.fail(a);
		const fA = Utility.retry(5)(f);

		fA(6).fork(x => {
			test.ok(false, 'should have failed');
			test.done();
		}, e => {
			test.equals(e, 6);
			test.done();
		});
	},
	'retry succeeded': test => {
		let v = 2;
		const f = a => {
			if (v--)
				return Async.of(a);
			else
				return Async.fail(a + 1);
		};

		const fA = Utility.retry(5)(f);

		fA(6).fork(x => {
			test.equals(x, 6);
			test.done();
		}, e => {
			test.ok(false, 'should have worked');
			test.done();
		});
	}

};