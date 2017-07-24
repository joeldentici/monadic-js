'use strict';

/**
 *	MonadicJS.Maybe
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Defines the Maybe monad.
 */




const {constructJust, Just} = require('./just.js');
exports.Just = constructJust;
const Nothing = require('./nothing.js');
exports.Nothing = Nothing;

/**
 *	unit/of :: a -> Just a
 *
 *	Puts a value into Maybe context.
 */
Just.of = Nothing.constructor.of = exports.of = exports.unit = exports.Just;

exports.empty = Nothing;

/**
 *	zero :: () -> Nothing
 */
Just.zero = Nothing.constructor.zero = exports.zero = () => Nothing;

/**
 *	nullable :: a -> Maybe a
 *
 *	Puts a value into Maybe context. If it
 *	is null or undefined, Nothing is returned.
 */
exports.nullable = (a) => (a === null ||  a === undefined) ? 
	exports.Nothing : exports.Just(a);