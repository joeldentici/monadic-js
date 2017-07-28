const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const F = require('../src/monadic.js').ConcurrentFree;
const {interpreter: controlInterpreter, tryF, throwE, fromAsync} = F.Control;
const Async = require('../src/async');
const AsyncComputation = require('../src/async/asynccomputation.js');
const {CaseClass, skip, resume} = require('../src/utility.js');
//for testing, we will schedule computations to actually run immediately!
AsyncComputation.schedule = x => x();

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
Async.of('').constructor.prototype.ap = Async.of('').constructor.prototype.app;
const oldAp = F.prototype.ap;
F.prototype.ap = F.prototype.app;

const {equals} = require('../test-lib.js');

function runAsync(comp) {
	return comp.fork(identity, identity);
}

function runFree(interpret) {
	return prog => runAsync(interpret(prog));
}

class Print extends CaseClass {
	constructor(msg) {
		super();
		this.msg = msg;
	}

	doCase(fn) {
		return fn(this.msg);
	}
}

class GetInput extends CaseClass {
	constructor() {
		super();
	}

	doCase(fn) {
		return fn();
	}
}

class Bad extends CaseClass {

	doCase(fn) {
		return fn();
	}
}

const print = msg => F.liftF(new Print(msg));
const getInput = F.liftF(new GetInput());
const bad = F.liftF(new Bad());

class Interpreter {
	constructor(msgs) {
		this.msgs = msgs;
	}

	setup() {
		return Async.of();
	}

	transform(inst) {
		return inst.case({
			Print: msg => {
				this.msgs.push(msg);
				return Async.of();
			},
			GetInput: () => Async.of("FakeInput"),
			default: () => {},
		});
	}

	cleanupSuccess() {
		return Async.of();
	}

	cleanupFail() {
		return Async.of();
	}
}

const interpreter = msgs => () => new Interpreter(msgs);

const run = runFree(F.interpret(
	Async,
	controlInterpreter
));


function getRun(msgs) {
	return runFree(F.interpret(
		Async,
		controlInterpreter,
		interpreter(msgs)
	));
}


exports.ConcurrentFree = {
	'Applicative': applicative.laws(λ)(F, run),
	'Identity (Applicative)': applicative.identity(λ)(F, run),
	'Composition (Applicative)': applicative.composition(λ)(F, run),
	'Homomorphism (Applicative)': applicative.homomorphism(λ)(F, run),
	'Interchange (Applicative)': applicative.interchange(λ)(F, run),

	'Functor': functor.laws(λ)(F.of, run),
	'Identity (Functor)': functor.identity(λ)(F.of, run),
	'Composition (Functor)': functor.composition(λ)(F.of, run),


	'Monad': monad.laws(λ)(F, run),
	'Left Identity (Monad)': monad.leftIdentity(λ)(F, run),
	'Right Identity (Monad)': monad.rightIdentity(λ)(F, run),
	'Associativity (Monad)': monad.associativity(λ)(F, run),

	'Free Side Effect Test': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			const prog = print('Hey').chain(_ => getInput).map(identity);

			const expected = 'FakeInput';
			const result = run(prog);

			const expectedMsgs = ['Hey'];

			return equals(result, expected) && equals(msgs, expectedMsgs);
		},
		[Number]
	),
	'SeqL/R': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			const prog = print('Hey').seqL(getInput);
			const prog2 = print('Hey').seqR(getInput).map(identity);

			const expected = undefined;
			const result = run(prog);

			const expected2 = 'FakeInput';
			const result2 = run(prog2);

			return equals(result, expected) && equals(result2, expected2)
		},
		[Number]
	),
	'alt': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			const prog = F.of(a).alt(F.of('Hey'));
			const prog2 = throwE('Err').alt(F.of(a));

			const expected = a;
			const result = run(prog);

			const expected2 = a;
			const result2 = run(prog2);

			const expected3 = undefined;
			const result3 = run(F.zero().chain(_ => F.of(a)));

			return equals(result, expected) && equals(result2, expected2)
				&& equals(result3, expected3);
		},
		[Number]
	),
	'no interpreter': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			const prog = bad;

			const expected = 'No transformation for';
			const result = run(prog);

			return result.message.startsWith(expected);
		},
		[Number]
	),
	'ap': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			F.prototype.ap = oldAp;

			//const prog = F.of(a).ap(F.of(x => x + 1));
			const prog = fromAsync(Async.of(a)).ap(F.of(x => x + 1));

			const expected = a + 1;
			const result = run(prog);

			return equals(result, expected);
		},
		[Number]
	),
	'fail/catch/mapFail': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			//const prog = F.of(a).ap(F.of(x => x + 1));
			const prog = F.of(0).chain(_ => F.fail(a)).chainFail(e => F.of(e + 1));

			const prog2 = F.fail(a).mapFail(e => e + 1);

			const expected = a + 1;
			const result = run(prog);
			const result2 = run(prog2);

			return equals(result, expected) && equals(result, expected);
		},
		[Number]
	),
	'skipping': λ.check(
		a => {
			const msgs = [];
			const run = getRun(msgs);

			//const prog = F.of(a).ap(F.of(x => x + 1));
			const prog = F.of(a)
				.chain(_ => F.fail(skip))
				.chain(x => x * 5);

			const prog2 = F.Control.delay
				.chain(_ => F.fail(new Error('err')));

			const resumed = resume(prog).map(_ => a + 1);
			const resumed2 = resume(prog2).map(_ => a + 1);

			const expected = a + 1;
			const result = run(resumed);

			const expected2 = 'err';
			const result2 = run(resumed2).message;

			return equals(result, expected) && equals(result2, expected2);
		},
		[Number]
	),
	'fromPromise': test => {
		const prog = F.Control.fromPromise(Promise.resolve(5)).map(x => x + 1);

		const interpret = F.interpret(Async, F.Control.interpreter);

		interpret(prog).fork(x => {
			test.equals(x, 6);
			test.done();
		}, e => e);
	}


};