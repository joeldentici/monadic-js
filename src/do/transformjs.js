
/**
 *	MonadicJS.Do.TransformJS
 *	written by Joel Dentici
 *	on 7/10/2017
 *
 *	This module provides a function to transform
 *	JavaScript source that contains do and expr
 *	blocks to an equivalent one with those blocks
 *	mapped to actual JavaScript syntax.
 *
 *	This relies on lexing the source, scanning until
 *	a block is found, emitting tokens that are not
 *	part of a block immediately to the output buffer.
 *
 *	Once a block is found, we begin parsing at the current
 *	input position. The AST of the parsed block is then
 *	analyzed and transformed to get a new AST with only
 *	JavaScript syntax. That AST is finally mapped back to 
 *	JavaScript source code by the generator.
 *
 *	After a block has been fully transformed, we begin
 *	scanning and immediate re-emitting until we find another
 *	block.
 *
 *	The resulting output buffers are concatenated and returned.
 */