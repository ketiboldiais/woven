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
  constructor(args: MathExpression[]) {
    super("+", args);
  }
}

/** Returns a new sum expression. */
const sum = (args: MathExpression[]) => (new Sum(args));

/** Returns true if the given object is a sum expression. */
const isSum = (obj: any): obj is Sum => (obj instanceof Sum);

/**
 * An object corresponding to a product.
 * Products may have an arbitrary number
 * of arguments.
 */
class Product extends Compound {
  constructor(args: MathExpression[]) {
    super("*", args);
  }
}

/** Returns a new product expression. */
const product = (args: MathExpression[]) => (new Product(args));

/** Returns true if the given object is a product. */
const isProduct = (obj: any): obj is Product => (obj instanceof Product);

/**
 * An object corresponding to a power expression.
 * The `^` operator is a binary infix operator.
 * That is, `^` always takes two, and only two,
 * arguments.
 */
class Power extends Compound {
  $args: [MathExpression, MathExpression];
  constructor(base: MathExpression, exponent: MathExpression) {
    super("^", [base, exponent]);
    this.$args = [base, exponent];
  }
}

/** Returns a new power expression. */
const power = (
  base: MathExpression,
  exponent: MathExpression,
) => (new Power(base, exponent));

/** An object corresponding to a difference expression. */
class Difference extends Compound {
  $args: [MathExpression, MathExpression];
  constructor(left: MathExpression, right: MathExpression) {
    super("-", [left, right]);
    this.$args = [left, right];
  }
}

/** Returns the difference expression `left - right`. */
const diff = (left: MathExpression, right: MathExpression) => (
  new Difference(left, right)
);

/** Returns the negation of the given expression. */
const neg = (expression: MathExpression) => (
  product([int(-1), expression])
);

/** An object corresponding to a quotient. */
class Quotient extends Compound {
  $args: [MathExpression, MathExpression];
  constructor(a: MathExpression, b: MathExpression) {
    super("/", [a, b]);
    this.$args = [a, b];
  }
}

/** Returns a new quotient expression. */
const quotient = (a: MathExpression, b: MathExpression) => (
  new Quotient(a, b)
);

/** An object corresponding to a factorial. */
class Factorial extends Compound {
  $args: [MathExpression];
  constructor(arg: MathExpression) {
    super("!", [arg]);
    this.$args = [arg];
  }
}

/** Returns a new factorial expression. */
const factorial = (arg:MathExpression) => (new Factorial(arg));
