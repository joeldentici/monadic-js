'use strict';

/**
 *	Monadic.Either
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Defines the Either monad.
 */




exports.Left = require('./left.js');
exports.Right = require('./right.js');

/**
 *	unit :: a -> Right a
 *
 *	Puts a value into Either context.
 */
exports.unit = exports.Right;