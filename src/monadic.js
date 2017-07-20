'use strict';

/**
 *	MonadicJS
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	This library provides implementations of common
 *	monads in JavaScript.
 *
 *	Utility functions for working with monads abstractly are also
 *	provided, as well as a generator-based do-notation utility.
 */

/* Export submodules */
exports.Utility = require('./utility.js');
exports.Either = require('./either');
exports.Maybe = require('./maybe');
exports.Async = require('./async');
exports.State = require('./state');
exports.Parser = require('./parser');
exports.transformDo = require('./do/transformjs.js');
exports.loadDo = require('./do');
exports.ArrayExtensions = require('./extendArray.js');
exports.FunctionExtensions = require('./extendFunction.js');
exports.ConcurrentFree = require('./concurrent-free');