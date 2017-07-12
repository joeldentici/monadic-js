'use strict';

/**
 *	Monadic
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	This library provides implementations of common
 *	monads in JavaScript.
 *
 *	Utility functions for working with monads abstractly are also
 *	provided, as well as a generator-based do-notation utility.
 */

/* Make Promise fit our monad interface */
Promise.prototype.bind = Promise.prototype.then;
Promise.prototype.chain = Promise.prototype.bind;
Promise.unit = Promise.resolve;
Promise.zero = () => Promise.reject();

/* Make Array a monad, applicative, and alternative */
Array.prototype.chain = function(f) {
	const arrs = this.map(f);
	return [].concat(...arrs);
}
Array.prototype.bind = Array.prototype.chain;
Array.of = function(a) {
	return [a];
}
Array.prototype.app = function(xs) {
	const fs = this;
	return fs.chain(f =>
		xs.map(x =>
			f(x)
		)
	);
}
Array.prototype.ap = function(a) {
	return a.app(this);
}
Array.prototype.seqL = function(ys) {
	const xs = this;
	return xs.chain(x =>
		ys.map(y => x));
}
Array.prototype.seqR = function(ys) {
	const xs = this;
	return xs.chain(x =>
		ys.map(y => y));

}
Array.zero = () => Array.prototype.empty;
Array.empty = [];
Array.prototype.alt = function(other) {
	return [].concat(this, other);
}
Array.cons = function(x, xs) {
	return [x].concat(xs);
}
Array.append = function(x, xs) {
	return [].concat(xs, x);
}
Array.prototype.foldr = function(f, z) {
	if (this.length === 0)
		return z;
	else
		return f(this[0], this.slice(1).foldr(f, z));
}
Array.prototype.foldl = function(f, z) {
	if (this.length === 0)
		return z;
	else
		return f(this.slice(1).foldl(f, z), this[0]);
}

/* Export submodules */
exports.Free = require('./free');
exports.Utility = require('./utility.js');
exports.Either = require('./either');
exports.Maybe = require('./maybe');
exports.Async = require('./async');
exports.State = require('./state');
exports.Parser = require('./parser');
exports.transformDo = require('./do/transformjs.js');
exports.loadDo = require('./do');