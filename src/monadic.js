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
Promise.prototype.unit = Promise.prototype.resolve;

/* Make Array fit our monad interface */
Array.prototype.chain = function(f) {
	const arrs = this.map(f);
	return [].concat(...arrs);
}
Array.prototype.of = function(a) {
	return [a];
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