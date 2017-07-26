const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const Async = require('../src/async');
const AsyncComputation = require('../src/async/asynccomputation.js');
//for testing, we will schedule computations to actually run immediately!
const oldSchedule = Async.setScheduler(x => x());

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
const oldAp = Async.of().constructor.prototype.ap;
Async.of('').constructor.prototype.ap = Async.of('').constructor.prototype.app;

const {equals} = require('../test-lib.js');

const Maybe = require('../src/maybe');
const Either = require('../src/either');

function runAsync(comp) {
	return Async.fork(comp, identity, identity);
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
			const result = runAsync(Async.throwE(a).mapFail(x => x + 5));

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
	'throw absorption': λ.check(
		a => {
			const expected = runAsync(Async.fail("hey"));
			const result = runAsync(Async.of(a).bind(_ => {
				throw "hey";
			}));

			const result2 = runAsync(Async.create((succ, fail) => {
				throw "hey";
			}));

			const result3 = runAsync(Async.of(a).map(_ => {
				throw "hey";
			}));

			return equals(result, expected) && equals(result2, expected) && equals(result3, expected);
		},
		[Number]
	),
	'calling succ/fail multiple times': λ.check(
		a => {
			const expected = runAsync(Async.fail('eee'));
			const vals = [];
			const result = Async.create((succ, fail) => {
				const x = fail('eee');
				succ(a);
				succ(a);
				return x;
			}).fork(v => {
				vals.push(v);
				return v;
			}, e => {
				vals.push(e);
				return e;
			});

			const expected2 = runAsync(Async.of(a));
			const vals2 = [];
			const result2 = Async.create((succ, fail) => {
				const x = succ(a);
				fail('eee');
				succ(a);
				return x;
			}).fork(v => {
				vals2.push(v);
				return v;
			}, e => {
				vals2.push(e);
				return e;
			});

			return equals(result, expected) && equals(result2, expected2)
				&& vals.length === 1 && vals2.length === 1;
		},
		[Number]
	),
	'case/run': λ.check(
		a => {
			const fn = (succ, fail) => {
				return succ(a);
			};

			const expected = fn(identity, identity);
			const result = Async.create(fn).doCase(f => f(identity, identity));
			const result2 = Async.create(fn).run();

			const result3 = Async.first(Async.create(fn), Async.of(5)).run();
			const result4 = Async.first(Async.fail(a), Async.of(5), Async.fail(5)).run();

			const result5 = Async.first(Async.fail(a)).doCase(x => x[0]).run();
			const expected5 = Async.run(Async.fail(a));

			return equals(result, expected) && equals(result2, expected)
				&& equals(result3[0], expected) && equals(result3[1], undefined)
				&& equals(result4[0], expected) && equals(result4[1], undefined)
				&& equals(result4[2], undefined) && equals(result5, expected5);
		},
		[Number]
	),
	'old ap': λ.check(
		a => {
			const fn = x => x + 1;
			Async.of('').constructor.prototype.ap = oldAp;

			const expected = runAsync(Async.of(fn(a)));
			const result = runAsync(Async.of(a).ap(Async.of(fn)));

			return equals(result, expected);
		},
		[Number]
	),
	'all': λ.check(
		() => {
			const expected = [1];
			const result = runAsync(Async.all([Async.of(1)]));
			const result2 = runAsync(Async.all(Async.of(1)));

			return equals(result, expected) && equals(result2, expected);
		},
		[]
	),
	'try': λ.check(
		() => {
			const expected = 1;
			const result = runAsync(Async.try(Async.of(1)));

			return equals(result, expected);
		},
		[]
	),
	'fromMaybe/Either': λ.check(
		() => {
			const expected = 1;
			const result = runAsync(Async.fromMaybe(Maybe.of(1)));
			const expected2 = 'Async.fromMaybe: Received Maybe.Nothing';
			const result2 = runAsync(Async.fromMaybe(Maybe.Nothing)).message;

			const result3 = runAsync(Async.fromEither(Either.of(1)));
			const result4 = runAsync(Async.fromEither(Either.Left(expected2)));

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected) && equals(result4, expected2);
		},
		[]
	),
	'wrap': λ.check(
		() => {
			const fn = (a, b, cb) => cb(null, a + b);
			const fn2 = (a, b, cb) => cb("err");

			const afn = Async.wrap(fn);
			const afn2 = Async.wrap(fn2);

			const result = runAsync(afn(1,2));
			const result2 = runAsync(afn2(1,2));

			const expected = 3;
			const expected2 = 'err';

			return equals(result, expected) && equals(result2, expected2);
		}, []
	),
	'parallel': λ.check(
		() => {
			const par = Async.parallel(Worker);

			const test = x => x + 1;
			const parTest = par(test);

			const expected = test(1);
			const result = runAsync(parTest(1));


			const test2 = (x => y => x + y)(5);
			const parTest2 = par(test2);

			const expected2 = 'x is not defined';
			const result2 = runAsync(parTest2(5)).message;

			const test3 = x => y => x + y;
			const parTest3 = par(test3);

			const expected3 = "Don't use curried functions with Async.parallel";
			const result3 = runAsync(parTest3(5)).message;

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		}, []
	),
	'fromPromise/await': test => {
		AsyncComputation.schedule = oldSchedule;

		const a1 = Async.fromPromise(Promise.resolve(5));
		const pf = Promise.reject(6);
		pf.catch(e => e);
		const a2 = Async.fromPromise(pf);

		a1.fork(x => {
			test.equals(x, 5);
			a2.fork(x => x, x => {
				test.equals(x, 6);
				test.done();
			});
		}, x => x);
	},
	'toPromise': test => {
		AsyncComputation.schedule = oldSchedule;

		const p1 = Async.toPromise(Async.of(5));
		const p2 = Async.toPromise(Async.fail(6));

		p1.then(x => {
			test.equals(x, 5);
			p2.catch(e => {
				test.equals(e, 6);
				test.done();
			});
		});
	},
	'toObservable': test => {
		AsyncComputation.schedule = oldSchedule;

		const o1 = Async.of(5).toObservable();
		const o2 = Async.fail(6).toObservable();

		o1.subscribe({
			onNext: x => test.equals(x, 5),
			onError: e => test.equals(0, 1),
			onCompleted: () => {
				o2.subscribe({
					onNext: x => test.equals(0, 1),
					onError: e => {
						test.equals(e, 6)
						test.done();
					},
					onCompleted: () => test.equals(0, 1),
				});
			}
		});
	},
	'sleep': test => {
		AsyncComputation.schedule = oldSchedule;

		const a1 = Async.sleep(100).map(_ => 5);

		a1.fork(x => {
			test.equals(x, 5);
			test.done();
		}, e => e);
	},
	'wrapPromise': test => {
		AsyncComputation.schedule = oldSchedule;

		const f = x => Promise.resolve(x);
		const f2 = x => Promise.reject(x);

		const af = Async.wrapPromise(f);
		const af2 = Async.wrapPromise(f2);

		const a1 = af(5);
		const a2 = af2(6);

		a1.fork(x => {
			test.equals(x, 5);
			a2.fork(x => x, x => {
				test.equals(x, 6);
				test.done();
			});
		}, x => x);
	},
};

//WebWorker mock
class Worker {
	constructor(fn) {
		this._worker = new fn();
		this._worker.postMessage = x => this.onmessage({data: x});
	}

	postMessage(x) {
		return this._worker.onmessage({data: x});
	}

	terminate() {

	}
}