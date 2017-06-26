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

/* Make Promise to fit our monad interface */
Promise.prototype.bind = Promise.prototype.then;
Promise.prototype.unit = Promise.prototype.resolve;

/* Export submodules */
exports.Free = require('./free');
exports.Utility = require('./utility.js');
exports.Either = require('./either');
exports.Maybe = require('./maybe');
exports.Async = require('./async');