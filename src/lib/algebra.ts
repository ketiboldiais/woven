/** An object corresponding to a mathematical expression. */
abstract class MathExpression {}

/** An object corresponding to an atomic expression. */
abstract class Atom extends MathExpression {}

/** An object corresponding to an integer. */
class Int extends Atom {
  $n: number;
  constructor(value: number) {
    super();
    this.$n = Math.floor(value);
  }
}

/** Returns a new integer. */
const int = (value: number) => (new Int(value));

/** An object corresponding to a symbol. */
class Sym extends Atom {
  $s: string;
  constructor(symbol: string) {
    super();
    this.$s = symbol;
  }
}

/** Returns a new symbol. */
const sym = (symbol: string) => (new Sym(symbol));

/**
 * An object corresponding to a compound
 * expression. All compound expressions
 * comprise of an operator and a list
 * of arguments.
 */
abstract class Compound extends MathExpression {
  $op: string;
  $args: MathExpression[];
  constructor(op: string, args: MathExpression[]) {
    super();
    this.$op = op;
    this.$args = args;
  }
}

/**
 * An object corresponding to a sum.
 * Sums may have an arbitrary number of
 * arguments.
 */
class Sum extends Compound {
  $op: "+" = "+";
  constructor(args: MathExpression[]) {
    super("+", args);
  }
}

/** Returns a new sum expression. */
const sum = (args: MathExpression[]) => (new Sum(args));

/** Returns true if the given object is a sum expression. */
const isSum = (obj:any): obj is Sum => (obj instanceof Sum);

/**
 * An object corresponding to a product.
 * Products may have an arbitrary number
 * of arguments.
 */
class Product extends Compound {
  $op: "*" = "*";
  constructor(args: MathExpression[]) {
    super("*", args);
  }
}

/** Returns a new product expression. */
const product = (args:MathExpression[]) => (new Product(args));

/** Returns true if the given object is a product. */
const isProduct = (obj:any): obj is Product => (obj instanceof Product);