/**
 *	MonadicJS.Do.Lexer
 *	written by Joel Dentici
 *	on 7/1/2017
 *
 *	This module performs lexical analysis on an
 *	input string according to a provided lexical
 *	grammar.
 */
class Lexer {
	constructor(rules, mappers = {}) {
		this.rules = rules;

		this.keys = Object.keys(rules).map(key => [key, new RegExp('^' + key)]);
	}

	lex(input) {
		let matches, output = [];
		input = input.toString();

		let index = 0;

		while (input) {
			//console.log(input);
			const [key, value] = this.keys
				.map(([k, regex]) => [k, input.match(regex)])
				.filter(([k,m]) => m)
				.map(([k,m]) => [k, m[0]])[0];

			const lexeme = this.rules[key];

			output.push({lexeme, value, index});

			input = input.substring(value.length);

			index++;
		}

		return output;
	}

	unlex(tokens) {
		return tokens.map(({lexeme,value}) => value).join();
	}
}

module.exports = Lexer;