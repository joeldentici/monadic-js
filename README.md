# Monadic #
Provides implementations of Maybe, Either, and Free as well as functions providing Haskell style do notation, and mapM.

The Free monad can be used to create monadic actions out of a functor. It provides the monadic composition of an underlying functor, and you supply an interpreter that gives the monad its semantics. This can often be easier than creating a new monad outright. I tend to use it to create simple DSLs.

At some point additional monad implementations may be added.

## do notation ##
Do notation is provided by the function doM. This function takes a generator, which is executed immediately to "desugar" the generator into a "bind" chain. This will only work for monads that apply the binding function once in bind, due to limitations of ES 6 generators. At a later time, a better implementation may be provided that will work for all monads.

Example:

```javascript
doM(function*() {
	const a = yield Maybe.Just(5);
	const b = yield Maybe.Just(10);
	return Maybe.unit(a + b);
}); //Maybe.Just(15)
```