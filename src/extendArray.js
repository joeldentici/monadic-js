
/**
 *	MonadicJS.ArrayExtensions
 *	written by Joel Dentici
 *	on 7/19/2017
 *
 *	Makes Array compatible with this library.
 *
 *	WARNING: This modifies the Array prototype
 *	so you should always unload it when done. You
 *	may still mess other code up if you use these
 *	extensions in an asynchronous section of code.
 */

const oldPrototype = {};

const oldConstructor = {};

const newPrototype = {
	chain: function(f) {
		const arrs = this.map(f);
		return [].concat(...arrs);	
	},
	ap: function(a) {
		return a.app(this);
	},
	app: function(xs) {
		const fs = this;
		return fs.chain(f =>
			xs.map(f));
	},
	seqL: function(ys) {
		const xs = this;
		return xs.chain(x => ys.map(_ => x));
	},
	seqR: function(ys) {
		const xs = this;
		return xs.chain(x => ys);
	},
	alt: function(other) {
		return [].concat(this, other);
	},
	foldr: function(f, z) {
		if (this.length === 0)
			return z;
		else
			return f(this[0], this.slice(1).foldr(f, z));
	},
	foldl: function(f, z) {
		if (this.length === 0)
			return z;
		else
			return f(this.slice(1).foldl(f, z), this[0]);
	}
};
newPrototype.bind = newPrototype.chain;

const newConstructor = {
	of: function(a) {
		return [a];
	},
	zero: function() {
		return [];
	},
	cons: function(x, xs) {
		return [x].concat(xs);
	},
	append: function(x, xs) {
		return [].concat(xs, x);
	},
};
newConstructor.unit = newConstructor.of;
newConstructor.empty = [];

function addExtensions() {
	Object.keys(newPrototype).forEach(k => {
		oldPrototype[k] = Array.prototype[k];
		Array.prototype[k] = newPrototype[k];
	});

	Object.keys(newConstructor).forEach(k => {
		oldConstructor[k] = Array[k];
		Array[k] = newConstructor[k];
	});
}

function removeExtensions() {
	Object.keys(oldPrototype).forEach(k => {
		Array.prototype[k] = oldPrototype[k];
	});

	Object.keys(oldConstructor).forEach(k => {
		Array[k] = oldConstructor[k];
	});
}

function useExtensions(fn) {
	addExtensions();
	const res = fn();
	removeExtensions();
	return res;
}

module.exports = {
	addExtensions,
	removeExtensions,
	useExtensions
};