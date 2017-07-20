'use strict';

/**
 *	MonadicJS.Either
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Defines the Either monad.
 */




const {Left, constructLeft} = require('./left.js');
const {Right, constructRight} = require('./right.js');

/**
 *	unit/of :: a -> Right a
 *
 *	Puts a value into Either context.
 */
Left.of = Right.of = exports.of = exports.unit = constructRight;

exports.Left = constructLeft;
exports.Right = constructRight;