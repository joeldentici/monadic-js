/**
 *	MonadicJS.do.LexicalGrammar
 *	written by Joel Dentici
 *	on 7/1/2017
 *
 *	This module defines the lexical grammar (parts of
 *	the CFG that can be recognized by regular expressions)
 *	for a subset of JavaScript's lexical gramar.
 */
const grammar = {};

grammar["/\\*[^]*?\\*/"] = "MultiLineComment";
grammar["//[^\\n]*"] = "Comment";
grammar["do!"] = "Sequence";
grammar["\\bexpr\\b"] = "Expr";
grammar["\\bdo\\b"] = "Do";
grammar["=>"] = "Arrow";
grammar["<-"] = "Bind";
grammar["\\("] = "LParen";
grammar["\\)"] = "RParen";
grammar["\\["] = "LBracket";
grammar["\\]"] = "RBracket";
grammar["{"] = "LBrace";
grammar["}"] = "RBrace";
grammar[";"] = "Semicolon";
grammar[","] = "Comma";
grammar["\\."] = "Dot";
grammar["==="] = "Equal";
grammar["=="] = "Equal";
grammar["="] = "Assignment";
grammar["!=="] = "NEqual";
grammar["!="] = "NEqual";
grammar[":"] = "Colon";
grammar["&&"] = "LogicalAND";
grammar["\\|\\|"] = "LogicalOR";
grammar["&"] = "BitAND";
grammar["\\|"] = "BitOR";
grammar["\\^"] = "BitXOR";
grammar["<<"] = "LeftShift";
grammar[">>="] = "BindOperator";
grammar[">=>"] = "KleisiOperator";
grammar[">>>"] = "UnsignedRightShift";
grammar[">>"] = "RightShift";
grammar["<\\$>"] = "MapOperator";
grammar["<\\|>"] = "AlternativeOperator";
grammar["<\\*>"] = "ApplicativeOperator";
grammar["<\\*"] = "LeftSeqOperator";
grammar["\\*>"] = "RightSeqOperator";
grammar["<="] = "LEqual";
grammar[">="] = "GEqual";
grammar["<"] = "LAngle";
grammar[">"] = "RAngle";
grammar["true"] = "True";
grammar["false"] = "False";
grammar["\\bin\\b"] = "In";
grammar["\\binstanceof\\b"] = "InstanceOf";
grammar["\\belse\\b"] = "Else";
grammar["\\bif\\b"] = "If";
grammar["\\bdelete\\b"] = "Delete";
grammar["\\breturn\\b"] = "Return";
grammar["[\\+\\-]?[0-9][a-z0-9\\.]*"] = "Number";
grammar["\\*"] = "Asterisk";
grammar["\\+\\+"] = "PlusPlus";
grammar["\\+"] = "Plus";
grammar["\\-\\-"] = "MinusMinus";
grammar["\\-"] = "Minus";
grammar["\\/"] = "Slash";
grammar["%"] = "Modulo";
grammar["[a-zA-Z_\\$][0-9a-zA-Z_\\$]*"] = "Identifier";
grammar['"([^\\\\"\\n]|\\\\.)*"'] = "String";
grammar["'([^\\\\'\\n]|\\\\.)*'"] = "String";
grammar["`(\\${.*}|[^\\\\`]|\\\\.)*`"] = "String";
grammar["\\s"] = "Whitespace";
grammar["[^\\s\\;]+"] = "JSText";

const mappers = {
};

module.exports = [grammar, mappers];
