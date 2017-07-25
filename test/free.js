const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {identity, constant} = require('fantasy-combinators');
const F = require('../src/monadic.js').ConcurrentFree;
const {interpreter: controlInterpreter} = F.Control;
const Async = require('../src/async');
const AsyncComputation = require('../src/async/asynccomputation.js');
const CaseClass = require('../src/utility.js').CaseClass;
//for testing, we will schedule computations to actually run immediately!
AsyncComputation.schedule = x => x();

/* This old version of fantasy-check's laws are using an outdated spec for Applicative,
 even though it is technically the right way. So we need to make ap = app */
Async.of('').constructor.prototype.ap = Async.of('').constructor.prototype.app;
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

const print = msg => F.liftF(new Print(msg));
const getInput = F.liftF(new GetInput());

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

			const prog = print('Hey').chain(_ => getInput);

			const expected = 'FakeInput';
			const result = run(prog);

			const expectedMsgs = ['Hey'];

			return equals(result, expected) && equals(msgs, expectedMsgs);
		},
		[Number]
	)

};