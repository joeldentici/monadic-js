const transformDo = require('./transformjs.js');
const Module = require('module');
const fs = require('fs');
const path = require('path');


/**
 *	MonadicJS.Do
 *	written by Joel Dentici
 *	on 6/30/2017
 *
 *	Provides ability to use do notation without
 *	relying on generators. This leads to fancier
 *	code and the ability to use monads that apply
 *	their bound function more than once, like list.
 *
 *	This module provides a function that can be called
 *	to install a hook into the node module loader, which
 *	will cause any later require() calls to have their
 *	module's source processed through this module. The
 *	transforming function itself is exported so you can
 *	write a simple source-to-source compiler if you prefer that.
 */


/**
 *	loadDo :: (string, bool) -> ()
 *
 *	Hooks into the node module loader and registers the
 *	specified extension to be pre-compiled by the do-notation
 *	transformer.
 *
 *	The default extension used when none is specified is '.ejs'
 *
 *	The second argument can be used to get verbose output from
 *	this function:
 *		Level 0 - Errors only
 *		Level 1 - Level 0 + Loading messages & compilation time
 *		Level 2 - Level 1 + Compilation output
 */
module.exports = function(ext = '.ejs', verbose = 0) {
	require('../extendFunction.js').addExtensions();
	require('../extendArray.js').addExtensions();

	verbose && console.log('Loading do notation and expression extensions...');

	function processFile(filename) {
		const source = fs.readFileSync(filename, 'utf8');
		verbose && console.log("Compiling " + filename);
		const start = Date.now() / 1000;

		const output = transformDo(source);

		return output.case({
			Right: code => {
				const end = Date.now() / 1000;
				verbose && console.log("Compiled " + filename, 'in', end - start, 'seconds');
				verbose >= 2 && console.log(code);
				return code;
			},
			Left: err => {
				console.error('Could not compile ' + filename);
				console.error(err);
				process.exit();
			}
		});		
	}

	Module._extensions[ext] = function(module, filename) {
		const jsFileName = '.' + path.basename(filename, ext) + '.js';
		const jsFilePath = path.join(
			path.dirname(filename),
			jsFileName
		);

		//stat both the .ejs file and the cached copy
		const ejsStats = fs.statSync(filename);

		let jsStats;
		try {
			jsStats = fs.statSync(jsFilePath);
		}
		catch (e) {
			jsStats = {mtime: 0};
		}

		//if the .ejs file has been touched since we created
		//the cached copy, we need to recompile
		if (ejsStats.mtime > jsStats.mtime) {
			const code = processFile(filename);
			fs.writeFileSync(jsFilePath, code);
			module._compile(code, filename);
		}
		//yay we can quickly load the cached copy
		else {
			verbose && console.log("Loading cached copy of " + filename);
			const code = fs.readFileSync(jsFilePath, 'utf8');
			verbose && console.log("Loaded cached copy of " + filename);
			module._compile(code, filename);
		}
	}

	verbose && console.log('Loaded do notation and expression extensions!');
}