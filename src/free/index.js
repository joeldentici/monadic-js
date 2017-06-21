'use strict';

/**
 *	Monadic.Free
 *	written by Joel Dentici
 *	on 6/20/2017
 *
 *	Defines the Free monad over a Functor.
 *
 *	data Free f a = Free (f (Free f a)) | Return a
 */




exports.Free = require('./free.js');
exports.Return = require('./return.js');

/**
 *	unit :: a -> Free f a
 *
 *	Puts a value into the Free monad over
 *	a functor.
 */
exports.unit = exports.Return;

/**
 *	liftF :: f a -> Free f a
 *
 *	Lifts a value in the functor into the Free
 *	monad over that functor.
 */
exports.liftF = a => exports.Free(a.map(exports.Return));