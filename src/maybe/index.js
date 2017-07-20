'use strict';

/**
 *	MonadicJS.Maybe
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Defines the Maybe monad.
 */




exports.Just = require('./just.js');
exports.Nothing = require('./nothing.js');

/**
 *	unit/of :: a -> Just a
 *
 *	Puts a value into Maybe context.
 */
exports.of = exports.unit = exports.Just;

/**
 *	nullable :: a -> Maybe a
 *
 *	Puts a value into Maybe context. If it
 *	is null or undefined, Nothing is returned.
 */
exports.nullable = (a) => (a === null ||  a === undefined) ? 
	exports.Nothing : exports.Just(a);