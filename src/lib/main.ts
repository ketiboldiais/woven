const print = console.log;

// § Native Mathematical Functions =============================================
const {
  abs,
  acos,
  acosh,
  asin,
  asinh,
  atan,
  atan2,
  atanh,
  cbrt,
  clz32,
  cos,
  cosh,
  exp: EXP,
  expm1,
  floor,
  fround,
  hypot,
  imul,
  log: ln,
  log10: log,
  log1p: ln1p,
  log2: lg,
  max,
  min,
  random,
  round,
  sign: sgn,
  sin,
  sinh,
  sqrt,
  tan,
  tanh,
  trunc,
} = Math;

// § Native Mathematical Constants =============================================
const MAX_INT = Number.MAX_SAFE_INTEGER;
const MAX_FLOAT = Number.MAX_VALUE;

/** Returns a% of b. */
const percent = (a: number, b: number) => ((a / 100) * b);

/** Returns true if the given `n` is a JavaScript number. */
const isJSNum = (x: any): x is number => (
  typeof x === "number" && !Number.isNaN(x)
);

/** Returns true if the given `n` is a JavaScript integer. */
const isJSInt = (n: any): n is number => (
  typeof n === "number" && (Number.isInteger(n))
);

/** Returns the factorial of the given number. */
const factorialize = (num: number) => {
  if (num === 0 || num === 1) {
    return 1;
  }
  for (var i = num - 1; i >= 1; i--) {
    num *= i;
  }
  return num;
};

/** Returns `a rem b` (the signed remainder). */
const rem = (a: number, b: number) => (a % b);

/** Returns `a mod b` (the unsigned remainder).  */
const mod = (a: number, b: number) => ((a % b) + b) % b;

/** Returns the integer quotient of a/b. */
const iquot = (a: number, b: number) => floor(a / b);

/** Returns the greatest common denominator of `a` and `b`. */
const gcd = (a: number, b: number) => {
  let A = floor(a);
  let B = floor(b);
  while (B !== 0) {
    let R = mod(A, B);
    A = B;
    B = R;
  }
  return abs(A);
};

// § Tree Printer ==============================================================
/**
 * In later sections, it will be useful to print
 * a pretty form of a given object tree.
 * We define that function here.
 */

/**
 * Returns a pretty-print string of the
 * given object.
 */
export const treed = (obj: Object) => {
  const makePrefix = (key: string, last: boolean) => {
    let str = last ? "└" : "├";
    if (key) {
      str += "─ ";
    } else {
      str += "──┐";
    }
    return str;
  };
  const filterKeys = (obj: Object, hideFunctions: boolean) => {
    const keys = [];
    for (var branch in obj) {
      if (!obj.hasOwnProperty(branch)) {
        continue;
      }
      // @ts-ignore
      if (hideFunctions && ((typeof obj[branch]) === "function")) {
        continue;
      }
      keys.push(branch);
    }
    return keys;
  };
  const growBranch = (
    key: string,
    root: Object,
    last: boolean,
    lastStates: ([Object, boolean])[],
    showValues: boolean,
    hideFunctions: boolean,
    callback: (L: string) => void,
  ) => {
    let line = "",
      index = 0,
      lastKey,
      // @ts-ignore
      circular,
      lastStatesCopy = lastStates.slice(0);

    if (lastStatesCopy.push([root, last]) && lastStates.length > 0) {
      lastStates.forEach(function (lastState, idx) {
        if (idx > 0) {
          line += (lastState[1] ? " " : "│") + "  ";
        }
        // @ts-ignore
        if (!circular && lastState[0] === root) {
          circular = true;
        }
      });
      line += makePrefix(key, last) + key;
      if (showValues && typeof root !== "object") {
        line += ": " + root;
      }
      circular && (line += " (circular ref.)");
      callback(line);
    }

    if (!circular && typeof root === "object") {
      let keys = filterKeys(root, hideFunctions);
      keys.forEach(function (branch) {
        lastKey = ++index === keys.length;
        growBranch(
          branch,
          // @ts-ignore
          root[branch],
          lastKey,
          lastStatesCopy,
          showValues,
          hideFunctions,
          callback,
        );
      });
    }
  };
  const str = () => {
    let tree = "";
    growBranch(
      ".",
      obj,
      false,
      [],
      true,
      true,
      (line) => tree += line + "\n",
    );
    return tree;
  };

  return str();
};

// § Auxiliary Functions =======================================================
/**
 * At the parsing stage, all parsed node results
 * are kept in an `Either` type (either an AST node)
 * or an Err (error) object. We want to avoid
 * throwing as much as possible for optimal parsing.
 */
type Either<A, B> = Left<A> | Right<B>;

/** A box type corresponding to failure. */
class Left<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }
  map<A>(f: (x: never) => A): Either<T, never> {
    return this as any;
  }
  isLeft(): this is Left<T> {
    return true;
  }
  isRight(): this is never {
    return false;
  }
  chain<X, S>(f: (x: never) => Either<X, S>): Left<T> {
    return this;
  }
  read<K>(value: K): K {
    return value;
  }
  flatten(): Left<T> {
    return this;
  }
  unwrap() {
    return this.value;
  }
  ap<B, E>(f: Either<T, E>): Either<never, B> {
    return this as any;
  }
}

/** A box type corresponding success. */
class Right<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }
  map<X>(f: (x: T) => X): Either<never, X> {
    return new Right(f(this.value));
  }
  isLeft(): this is never {
    return false;
  }
  isRight(): this is Right<T> {
    return true;
  }
  chain<N, X>(f: (x: T) => Either<N, X>): Either<never, X> {
    return f(this.value) as Either<never, X>;
  }
  flatten(): Right<(T extends Right<(infer T)> ? T : never)> {
    return ((this.value instanceof Right ||
        this.value instanceof Left)
      ? this.value
      : this) as Right<(T extends Right<(infer T)> ? T : never)>;
  }
  read<K>(_: K): T {
    return this.value;
  }
  unwrap() {
    return this.value;
  }
  ap<B, E>(f: Either<E, (x: T) => B>): Either<never, B> {
    if (f.isLeft()) return f as any as Right<B>;
    return this.map(f.value);
  }
}

/** Returns a new left. */
const left = <T>(x: T): Left<T> => new Left(x);

/** Returns a new right. */
const right = <T>(x: T): Right<T> => new Right(x);

// § Mathematical Objects ======================================================
// What follows are JavaScript objects that are created during
// code interpretation. These objects are also used in Woven’s algebraic
// runtime.

/** An object corresponding to a fraction.  */
class Fraction {
  /** The numerator of this fraction. */
  $n: number;
  /** The denominator of this fraction. */
  $d: number;
  constructor(n: number, d: number) {
    this.$n = floor(n);
    this.$d = floor(d);
  }
}

/** Returns a new fraction. */
const frac = (numerator: number, denominator: number) => (
  new Fraction(numerator, denominator)
);

/**
 * Returns true, and asserts, if
 * the given value is a fraction.
 */
const isFrac = (value: any): value is Fraction => (
  value instanceof Fraction
);

/** An object corresponding to a scientific number. */
class Scinum {
  $b: number;
  $e: number;
  constructor(b: number, e: number) {
    this.$b = b;
    this.$e = e;
  }
}

/** Returns a new scientific number. */
const scinum = (base: number, exponent: number) => (
  new Scinum(base, exponent)
);

/**
 * Returns true, and asserts, if the
 * given value is a scientific number.
 */
const isScinum = (value: any): value is Scinum => (
  value instanceof Scinum
);

class MSet<T> {
  $elements: Set<T>;
  constructor(elements: T[]) {
    this.$elements = new Set(elements);
  }
}

/** Returns a new Set. */
const set = <T>(elements: T[]) => (new MSet(elements));

/** An object corresponding to a vector. */
class Vector {
  $elements: number[];
  constructor(elements: number[]) {
    this.$elements = elements;
  }
  get length() {
    return this.$elements.length;
  }
  at(index: number) {
    return this.$elements[index - 1];
  }
}

/** Returns a new vector. */
const vector = (elements: number[]) => (
  new Vector(elements)
);

/**
 * Returns true, and asserts,
 * if the given `x` is a vector.
 */
const isVector = (x: any): x is Vector => (
  x instanceof Vector
);

/**
 * An object corresponding to a matrix.
 */
class Matrix {
  $vectors: Vector[];
  $rows: number;
  $columns: number;
  constructor(vectors: Vector[]) {
    this.$vectors = vectors;
    this.$rows = vectors.length;
    this.$columns = vectors[0].length;
  }
  get length() {
    return this.$rows;
  }
  row(index: number) {
    return this.$vectors[index - 1];
  }
}

/** Returns a new matrix. */
const matrix = (vectors: Vector[]) => (
  new Matrix(vectors)
);

/**
 * Returns true, and asserts,
 * if x is a matrix.
 */
const isMatrix = (x: any): x is Matrix => (
  x instanceof Matrix
);

// § Start: Compiler ===================================================

enum TokenType {
  /** Delimiter token: `(` */
  LEFT_PAREN,
  /** Delimiter token: `)` */
  RIGHT_PAREN,
  /** Delimiter token: `{` */
  LEFT_BRACE,
  /** Delimiter token: `}` */
  RIGHT_BRACE,
  /** Delimiter token: `[` */
  LEFT_BRACKET,
  /** Delimiter token: `]` */
  RIGHT_BRACKET,
  /** Delimiter token: `,` */
  COMMA,
  /** Delimiter token: `.` */
  DOT,
  /** Delimiter token: `:` */
  COLON,
  /** Delimiter token: `;` */
  SEMICOLON,

  /** Operator token: `|` */
  VBAR,
  /** Operator token: `&` */
  AMPERSAND,
  /** Operator token: `~` */
  TILDE,
  /** Operator token: `/` */
  SLASH,
  /** Operator token: `^` */
  CARET,
  /** Operator token: `-` */
  MINUS,
  /** Operator token: `--` */
  MINUS_MINUS,
  /** Operator token: `+` */
  PLUS,
  /** Operator token: `++` */
  PLUS_PLUS,
  /** Operator token: `*` */
  STAR,
  /** Operator token: `%` */
  PERCENT,
  /** Operator token: `!` */
  BANG,
  /** Operator token: `=` */
  EQUAL,
  /** Operator token: `==` */
  EQUAL_EQUAL,
  /** Operator token: `!=` */
  BANG_EQUAL,
  /** Operator token: `<` */
  LESS,
  /** Operator token: `>` */
  GREATER,
  /** Operator token: `<=` */
  LESS_EQUAL,
  /** Operator token: `>=` */
  GREATER_EQUAL,

  /** Keyword-operator token: `and` */
  AND,
  /** Keyword-operator token: `or` */
  OR,
  /** Keyword-operator token: `not` */
  NOT,
  /** Keyword-operator token: `rem` */
  REM,
  /** Keyword-operator token: `mod` */
  MOD,
  /** Keyword-operator token: `div` */
  DIV,
  /** Keyword-operator token: `nor` */
  NOR,
  /** Keyword-operator token: `xor` */
  XOR,
  /** Keyword-operator token: `xnor` */
  XNOR,
  /** Keyword-operator token: `nand` */
  NAND,

  /** Literal token: symbol */
  IDENTIFIER,
  /** Literal token: integer */
  INT,
  /** Literal token: float */
  FLOAT,
  /** Literal token: scientific number */
  SCIENTIFIC_NUMBER,
  /** Literal token: fraction */
  FRACTION,
  /** Literal token: string */
  STRING,

  /** Keyword tokens */
  CLASS,
  IF,
  ELSE,
  TRUE,
  FALSE,
  FOR,
  FN,
  NIL,
  PRINT,
  RETURN,
  SUPER,
  THIS,
  WHILE,
  NUMERIC_CONSTANT,
  LET,
  VAR,

  /** Utility tokens */
  ERROR,
  EMPTY,
  END,
}

/**
 * A token type corresponding to a number.
 */
type NumberTokenType =
  | TokenType.INT
  | TokenType.FLOAT
  | TokenType.SCIENTIFIC_NUMBER
  | TokenType.FRACTION;

/**
 * What follows are global constants.
 */
const PI = Math.PI;
const E = Math.E;

/** Tokens have a literal value, but they must be a Primitive type. */
type Primitive = number | string | boolean | null | Fraction | Scinum;

/** A class corresponding to a token. */
class Token<L extends (Primitive | Err) = any> {
  /** The token’s type. */
  $type: TokenType;

  /**
   * Returns true if this token is of the
   * given type, false otherwise.
   */
  is(type: TokenType) {
    return this.$type === type;
  }

  /** Returns a copy of this token with the provided token type. */
  type<K extends TokenType>(tokenType: K) {
    const out = this.clone();
    out.$type = tokenType as any;
    return out as any as Token<L>;
  }

  /** The line where this token first occurs. */
  $line: number;

  /** Returns a copy of this token with the provided number. */
  line(lineNumber: number) {
    const out = this.clone();
    out.$line = lineNumber;
    return out;
  }

  /** The column within the source code line where this token first occurs. */
  $column: number;

  /** Returns a copy of this token with the provided column number. */
  column(columnNumber: number) {
    const out = this.clone();
    out.$column = columnNumber;
    return out;
  }

  /** The lexeme corresponding to this token. */
  $lexeme: string;

  /** Returns a copy of this token with the provided lexeme. */
  lexeme(lexeme: string) {
    const out = this.clone();
    out.$lexeme = lexeme;
    return out;
  }

  /** The literal value corresponding to this token. */
  $literal: L;

  /** Returns a copy of this token with the provided literal. */
  literal<X extends Primitive>(literal: X) {
    const out = this.clone();
    out.$literal = literal as any;
    return out as any as Token<X>;
  }

  /**
   * Returns a string representation of this
   * token.
   */
  toString() {
    const typename = TokenType[this.$type];
    return `[${typename} “${this.$lexeme}” L${this.$line} C${this.$column}]`;
  }

  /**
   * Returns true if this token is the
   * empty token (its type is TokenType.EMPTY).
   * The empty token is used as a placeholder
   * token.
   */
  isEmpty() {
    return this.$type === TokenType.EMPTY;
  }

  /**
   * Returns true if this
   * token is an error token.
   */
  isErrorToken(): this is Token<Err> {
    return (
      this.$type === TokenType.ERROR
    );
  }

  /**
   * Returns true if this token
   * is a nil literal token.
   */
  isNilToken(): this is Token<null> {
    return (
      this.$type === TokenType.NIL
    );
  }

  /**
   * Returns true if this token
   * is an identifier token.
   */
  isIdentifier() {
    return (
      this.$type === TokenType.IDENTIFIER
    );
  }

  /**
   * Returns true, and asserts,
   * if this token is an integer token.
   */
  isNumericToken(): this is Token<number> {
    return (this.$type === TokenType.INT) || (
      this.$type === TokenType.FLOAT
    );
  }

  /**
   * Returns true, and asserts,
   * if this token is a scientific
   * number token.
   */
  isScientificNumber(): this is Token<Scinum> {
    return (
      this.$type === TokenType.SCIENTIFIC_NUMBER
    );
  }

  /**
   * Returns true, and asserts,
   * if this token is a numeric
   * constant.
   */
  isNumericConstant(): this is Token<number> {
    return (
      this.$type === TokenType.NUMERIC_CONSTANT
    );
  }

  /**
   * Returns true, and asserts,
   * if this token is a boolean token
   * (a token of type TRUE or FALSE).
   */
  isBoolean(): this is Token<boolean> {
    return (
      this.$type === TokenType.TRUE ||
      this.$type === TokenType.FALSE
    );
  }

  /**
   * Returns true, and asserts,
   * if this token is a fraction token.
   */
  isFraction(): this is Token<Fraction> {
    return (
      this.$type === TokenType.FRACTION
    );
  }

  /**
   * Returns true, and asserts, if this token is a
   * string literal token.
   */
  isStringToken(): this is Token<string> {
    return (
      this.$type === TokenType.STRING
    );
  }

  /**
   * Returns true if this token
   * is a right delimiter (
   * either `)`, `}`, or `]`).
   */
  isRightDelimiter() {
    return (
      this.$type === TokenType.RIGHT_PAREN ||
      this.$type === TokenType.RIGHT_BRACKET ||
      this.$type === TokenType.RIGHT_BRACE
    );
  }

  /**
   * Returns a copy of this token.
   */
  clone() {
    const out = new Token(
      this.$type,
      this.$lexeme,
      this.$literal,
      this.$line,
      this.$column,
    );
    return out;
  }

  /**
   * The empty token.
   */
  static empty: Token<any> = new Token(TokenType.EMPTY, "", null, -1, -1);

  /**
   * Returns a new END token.
   */
  static END() {
    return new Token(TokenType.END, "END", null, -1, -1);
  }

  constructor(
    type: TokenType,
    lexeme: string,
    literal: L,
    line: number,
    column: number,
  ) {
    this.$type = type;
    this.$lexeme = lexeme;
    this.$line = line;
    this.$column = column;
    this.$literal = literal;
  }
}

/**
 * Returns a new token.
 *
 * @param type
 * - The {@link TokenType} type.
 * @param lexeme
 * - The lexeme associated within this token.
 * @param literal
 * - A {@link Primitive} value associated with this token.
 * @param line
 * - The line within the source code where this token was read.
 * @param column
 * - The column within the line where this token was
 * read (specifically, the column where the lexeme starts).
 */
const token = <T extends (Primitive | Err)>(
  type: TokenType,
  lexeme: string,
  literal: T,
  line: number,
  column: number,
) => (
  new Token(type, lexeme, literal, line, column)
);

/**
 * § Error Classes
 * Before we proceed to implementing the compiler, we will
 * implement our error classes. Errors are classified by type.
 *
 * 1. `lexical-error` : An error encountered
 *     during lexical analysis (i.e., scanning).
 * 2. `syntax-error` : An error encountered during
 *     syntax analysis (i.e., parsing).
 * 3. `type-error` : An error encountered during
 *     type analysis (i.e., type-checking).
 * 4. `semantic-error` : An error encountered during
 *     semantic analysis. This includes environment
 *     errors (e.g., a failure to resolve a name binding)
 *     or violations of mathematical conventions.
 * 5. `runtime-error` : Any error that does not fall under
 *     the first four categories above.
 */

/**
 * To ensure our errors are always of a specific type,
 * we will define a type called `ErrorType`.
 */
type ErrorType =
  | "lexical-error"
  | "syntax-error"
  | "type-error"
  | "semantic-error"
  | "runtime-error";

/**
 * Now we define a class that corresponds to
 * an error object.
 */
class Err extends Error {
  /**
   * The type of this error. All errors fall under
   * one of the following types:
   *
   * 1. `lexical-error`
   * 2. `syntax-error`
   * 3. `semantic-error`
   * 4. `runtime-error`
   */
  $type: ErrorType;

  /**
   * The phase where this error occurred.
   * E.g., `"scanning a string"`, or
   * `"parsing an additive expression"`
   */
  $phase: string;

  /**
   * The line – within the source code
   * - where this error occurred.
   */
  $line: number;

  /**
   * The column – within the source code line
   * – where this error occurred.
   */
  $column: number;

  /**
   * This error’s message.
   */
  $message: string;

  constructor(
    message: string,
    type: ErrorType,
    phase: string,
    line: number,
    column: number,
  ) {
    super(message);
    this.$message = message;
    this.$type = type;
    this.$phase = phase;
    this.$line = line;
    this.$column = column;
  }
  print() {
    const out =
      `On line ${this.$line}, column ${this.$column}, while ${this.$phase}, a ${this.$type} occurred: ${this.$message}`;
    return out;
  }
}

// To avoid having to write `new` all the time,
// we will define an error factory function.

/**
 * This function
 * creates a function that consructs a specific
 * type of error.
 *
 * @param message - A message explaining this error.
 * @param phase - At what phase did this error occur (
 * e.g., `"parsing a multiplicative expression"`).
 * @param line - At what line – within the source code –
 * did this error occur.
 * @param column - At what column – within the line – did
 * this error occur.
 * @param fix - A possible way to fix this error.
 */
const errorFactory = (type: ErrorType) =>
(
  message: string,
  phase: string,
  line: number,
  column: number,
) => (new Err(message, type, phase, line, column));

/** Returns a new lexical error. */
const lexicalError = errorFactory("lexical-error");

/** Returns a new syntax error. */
const syntaxError = errorFactory("syntax-error");

/** Returns a new type error. */
const typeError = errorFactory("type-error");

/** Returns a new semantic error. */
const semanticError = errorFactory("semantic-error");

/** Returns a new runtime error. */
const runtimeError = errorFactory("runtime-error");

/**
 * § Scanning
 * Now that we've defined the error classes, we can proceed
 * to implementing our scanner. Before we do so, however, we
 * will define some regex helper functions.
 */

/**
 * This function returns true if the given
 * `char` is a Latin or Greek character. This is used
 * in the scanner to quickly identify potential identifiers
 * or keywords.
 */
const isLatinGreek = (
  char: string,
) => (/^[a-zA-Z_$\u00C0-\u02AF\u0370-\u03FF\u2100-\u214F]$/.test(char));

/**
 * This function returns true if the given
 * `char` is a math symbol.
 */
const isMathSymbol = (char: string) => /^[∀-⋿]/u.test(char);

/**
 * This function returns true if the given `char` is
 * a digit (specifically, a Hindu-Arabic numeral).
 */
const isDigit = (char: string) => "0" <= char && char <= "9";

/**
 * Conducts a lexical analysis of the given Woven
 * code.
 */
export function lexicalAnalysis(code: string) {
  /**
   * The current line the
   * lexer is reading.
   */
  let $line = 1;

  /**
   * The current column within the
   * {@link $line} the lexer is reading.
   */
  let $column = 1;

  /**
   * The index, within the code, of the
   * first character of the lexeme
   * currently being scanned.
   */
  let $start = 0;

  /**
   * The index, within the code, of
   * the character the lexer is currently
   * reading.
   */
  let $current = 0;

  /**
   * Error indicator defaulting to null.
   * If initialized, scanning will cease,
   * per the condition in {@link atEnd}.
   */
  let $error: null | Err = null;

  /**
   * Returns true if the scanner has reached
   * the end of the code, or if an error
   * has been encountered. In the future,
   * we may consider allowing the scanner
   * to run despite errors so as to collect
   * as many errors as possible.
   */
  const atEnd = () => (
    $current >= code.length || $error !== null
  );

  /**
   * Consumes and returns the next character
   * in the given code.
   */
  const tick = () => code[$current++];

  /**
   * Returns the character whose index is
   * {@link $current}, without moving the
   * lexer forward.
   */
  const peek = () => atEnd() ? "" : code[$current];

  /**
   * Returns true if the current character
   * matches the provided character.
   *
   * @param char - The character to match against.
   */
  const peekIs = (char: string) => (
    !atEnd() && (code[$current] === char)
  );

  /**
   * Returns the character just ahead of the character
   * currently pointed at by the scanner.
   */
  const peekNext = () => atEnd() ? "" : code[$current + 1];

  /**
   * Returns the character n places ahead of the
   * current character.
   */
  const lookup = (n: number) => atEnd() ? "" : code[$current + n];

  /**
   * Returns the code substring starting
   * from start to current.
   */
  const slice = () => code.slice($start, $current);

  /**
   * Returns a new token.
   * @param type - The token type.
   * @param lexeme - The lexeme associated with this token
   * @param literal - The literal value (if any) associated with
   * this token. Defaults to null.
   */
  const newToken = (
    type: TokenType,
    lexeme: string = "",
    literal: Primitive = null,
  ) => {
    lexeme = lexeme ? lexeme : slice();
    return token(type, lexeme, literal, $line, $column);
  };

  /**
   * Continuously moves the scanner forward as long
   * as its head encounters whitespace.
   */
  const skipWhitespace = () => {
    // As long as we haven’t reached the end
    while (!atEnd()) {
      // Get the current character
      const char = peek();
      // If the character is a space,
      // return, or tab, proceed to the
      // next character, and increment
      // the column number
      switch (char) {
        case " ":
        case "\r":
        case "\t":
          $column++;
          tick();
          break;
        // If the character is a new line,
        // increment the line number
        // and set the column to 0.
        case "\n":
          $line++;
          $column = 0;
          tick();
          break;
        // If none of the previous
        // conditions apply,
        // get out of this loop
        default:
          return;
      }
    }
  };

  /**
   * If the character after the current
   * character matches the expected string,
   * increment {@link $current} and return
   * true. Otherwise, return false without
   * incrementing.
   */
  const match = (expected: string) => {
    if (atEnd()) return false;
    if (code[$current] !== expected) return false;
    $current++;
    return true;
  };

  /**
   * Returns a new error token.
   * @param message - A message describing what the error is.
   * @param phase - At what point during scanning did this error occur.
   */
  const errorToken = (message: string, phase: string) => {
    $error = lexicalError(
      message,
      phase,
      $line,
      $column,
    );
    const out = token(TokenType.ERROR, "", $error, $line, $column);
    return out;
  };

  /**
   * Scans for an identifier or a keyword.
   */
  const scanWord = () => {
    while (
      (isLatinGreek(peek()) || isMathSymbol(peek()) || isDigit(peek())) &&
      (!atEnd())
    ) {
      tick();
    }

    // Get the current lexeme
    const lexeme = slice();

    // Check if the lexeme is a keyword.
    // If it is a keyword, return it.
    switch (lexeme) {
      case "this":
        return newToken(TokenType.THIS);
      case "super":
        return newToken(TokenType.SUPER);
      case "class":
        return newToken(TokenType.CLASS);
      case "false":
        return newToken(TokenType.FALSE).literal(false);
      case "true":
        return newToken(TokenType.TRUE).literal(true);
      case "NAN":
        return newToken(TokenType.NUMERIC_CONSTANT).literal(NaN);
      case "Inf":
        return newToken(TokenType.NUMERIC_CONSTANT).literal(Infinity);
      case "return":
        return newToken(TokenType.RETURN);
      case "while":
        return newToken(TokenType.WHILE);
      case "for":
        return newToken(TokenType.FOR);
      case "let":
        return newToken(TokenType.LET);
      case "var":
        return newToken(TokenType.VAR);
      case "fn":
        return newToken(TokenType.FN);
      case "if":
        return newToken(TokenType.IF);
      case "else":
        return newToken(TokenType.ELSE);
      case "print":
        return newToken(TokenType.PRINT);
      case "rem":
        return newToken(TokenType.REM);
      case "mod":
        return newToken(TokenType.MOD);
      case "div":
        return newToken(TokenType.DIV);
      case "nil":
        return newToken(TokenType.NIL).literal(null);
      case "and":
        return newToken(TokenType.AND);
      case "or":
        return newToken(TokenType.OR);
      case "nor":
        return newToken(TokenType.NOR);
      case "xor":
        return newToken(TokenType.XOR);
      case "xnor":
        return newToken(TokenType.XNOR);
      case "not":
        return newToken(TokenType.NOT);
      case "nand":
        return newToken(TokenType.NAND);
    }
    // If we make it to this line, then
    // the lexeme thus far is a user
    // symbol (e.g., a variable name,
    // a function name, etc.)
    return newToken(TokenType.IDENTIFIER);
  };

  /**
   * Scans for a string. Strings are always
   * surrounded by double quotes.
   */
  const scanString = () => {
    // We keep the scanner moving forward
    // as long as we do not encounter a closing
    // quote, and as long as we haven’t reached
    // the end of code input.

    while (peek() !== `"` && !atEnd()) {
      // If we encounter a new line:
      //   1. increment the line number.
      //   2. reset the column to 0, since the column
      //      always restarts at a new line.
      if (peek() !== `\n`) {
        $line++;
        $column = 0;
      } else {
        // If we do not encounter a new line, then
        // increment the column.
        $column++;
      }
      // Keep moving forward so long as we
      // haven’t encountered the closing
      // quote.
      tick();
    }

    // If we’ve reached the end at this point,
    // then that means we didn’t consume
    // a closing double quote. So, we return
    // an error.
    if (atEnd()) {
      return errorToken(
        `Infinite string`,
        `scanning a string`,
      );
    }
    // Otherwise, there is a double-quote, so
    // we consume it.
    tick();

    // Now take the lexeme thus far.
    // This lexeme includes the double-quotes,
    // so we remove them with `slice(1,-1).`
    const lexeme = slice();
    const literal = lexeme.slice(1, -1);

    return newToken(TokenType.STRING, lexeme, literal);
  };

  /**
   * Scans for a binary number.
   */
  const scanBinaryNumber = () => {
    // If the peek isn’t a 0 or a 1, then
    // we return an error. `0b` prefaces a binary
    // number, which must always be followed by
    // a 0 or a 1.
    if (!(peekIs("0") || peekIs("1"))) {
      return errorToken(
        `Expected binary digits after “0b”`,
        `scanning a binary number`,
      );
    }

    // As long as we keep seeing a 0 or a 1 and haven’t reached
    // the end,
    while ((peekIs("0") || peekIs("1")) && !atEnd()) {
      // keep moving forward
      tick();
    }
    // Get the lexeme thus far
    const lexeme = slice();

    // Remove the '0b' from the lexeme
    const binaryDigitString = lexeme.replace("0b", "");

    // Convert the modified string into an integer
    const numericValue = Number.parseInt(binaryDigitString, 2);

    return newToken(TokenType.INT).literal(numericValue);
  };

  const newNumberToken = (
    numberString: string,
    type: NumberTokenType,
    hasSeparators: boolean,
  ) => {
    const n = hasSeparators ? numberString.replaceAll("_", "") : numberString;
    switch (type) {
      case TokenType.INT: {
        const num = Number.parseInt(n);
        if (num > MAX_INT) {
          return errorToken(
            `encountered an integer overflow.`,
            `scanning an integer literal`,
          );
        } else {
          return newToken(type).literal(num);
        }
      }
      case TokenType.FLOAT: {
        const num = Number.parseFloat(n);
        if (num > MAX_FLOAT) {
          return errorToken(
            `encountered a floating point overflow.`,
            `scanning a floating point number`,
          );
        } else {
          return newToken(type).literal(num);
        }
      }
      case TokenType.SCIENTIFIC_NUMBER: {
        const [a, b] = n.split("E");
        const base = Number.parseFloat(a);
        const exponent = Number.parseInt(b);
        return newToken(type).literal(scinum(base, exponent));
      }
      case TokenType.FRACTION: {
        const [N, D] = n.split("|");
        const numerator = Number.parseInt(N);
        const denominator = Number.parseInt(D);
        if (numerator > MAX_INT) {
          return errorToken(
            `encounterd an integer overflow in the numerator of “${n}”`,
            `scanning a fraction`,
          );
        } else if (denominator > MAX_INT) {
          return errorToken(
            `encounterd an integer overflow in the denominator of “${n}”`,
            `scanning a fraction`,
          );
        } else {
          return newToken(type).literal(frac(numerator, denominator));
        }
      }
      default:
        return errorToken(
          `unknown number type`,
          `scanning a number`,
        );
    }
  };

  /**
   * Scans for a number. There are 7 possible
   * number token types:
   *
   * 1. INT
   * 2. FLOAT
   * 3. FRACTION
   * 4. SCIENTIFIC_NUMBER
   * 5. BIG_INT
   * 6. BIG_FRACTION
   * 7. COMPLEX
   */
  const scanNumber = (initialType: NumberTokenType) => {
    let type = initialType;
    let didScanSeparators = false;
    while (isDigit(peek()) && !atEnd()) {
      tick();
    }
    if (peekIs("_") && isDigit(peekNext())) {
      // eat the '_'
      tick();

      // we just scanned a separator, so note that
      didScanSeparators = true;

      // keep track of how many digits we encounter after
      // the '_'
      let digits = 0;

      // as long as we haven’t reached
      // the end and keep encountering
      // digits
      while (isDigit(peek()) && !atEnd()) {
        // move the scanner forward, and
        tick();

        // increment the digit counter
        digits++;

        // if the next character is a '_',
        // then this is a separated number with
        // multiple separators.
        if (peekIs("_") && isDigit(peekNext())) {
          // But, we require that there are exactly
          // three digits between two separators.
          if (digits === 3) {
            // If there are exactly three digits,
            // then move scanner forward,
            tick();

            // and reset the digits counter.
            digits = 0;
          } else {
            // we return an error
            return errorToken(
              // the error message
              `Expected 3 digits after the separator “_” but got ${digits}.`,
              // the phase where this error occurred
              `scanning an underscore-separated number`,
            );
          }
        }
      }
      // There must ALWAYS be three digits after a separator
      // E.g., “2_” is not a valid number.
      if (digits !== 3) {
        return errorToken(
          // the error message
          `Expected 3 digits after the separator “_” but got ${digits}.`,
          // the phase where this error occurred
          `scanning an underscore-separated number`,
        );
      }
    }

    // The digit could be followed by a dot.
    // If it is, then this is a floating point
    // number.
    if (peekIs(".") && isDigit(peekNext())) {
      // Eat the dot.
      tick();
      // Toggle the number type to a FLOAT.
      type = TokenType.FLOAT;
      // Continue consuming digits.
      while (isDigit(peek()) && !atEnd()) {
        tick();
      }
    }

    // The digit could be followed by a vertical bar.
    // If it is, then this is a fraction.
    if (peekIs("|")) {
      if (type !== TokenType.INT) {
        return errorToken(
          `Expected an integer before “|”`,
          `scanning a fraction`,
        );
      }
      type = TokenType.FRACTION;
      tick();
      while (isDigit(peek()) && !atEnd()) {
        tick();
      }
      return newNumberToken(slice(), type, didScanSeparators);
    }

    // The number could be followed by an `E`.
    // If it is, then this is a scientific number.
    if (peekIs("E")) {
      if (isDigit(peekNext())) {
        type = TokenType.SCIENTIFIC_NUMBER;
        tick();
        while (isDigit(peek())) {
          tick();
        }
      } else if (
        ((peekNext() === "+") || (peekNext() === "-")) && isDigit(lookup(2))
      ) {
        type = TokenType.SCIENTIFIC_NUMBER;
        tick();
        tick();
        while (isDigit(peek())) {
          tick();
        }
      }
    }
    return newNumberToken(slice(), type, didScanSeparators);
  };

  /** Scans the provided code for a token. */
  const scan = () => {
    // We always start by skipping whitespace.
    skipWhitespace();

    $start = $current;

    // If we’ve reached the end, immediately return an END token.
    if (atEnd()) {
      return newToken(TokenType.END, "END");
    }

    // Now we get the current character
    const char = tick();

    // First, check if this is a Latin or Greek
    // character. If it is, then this is either an identifier
    // or a keyword.
    if (isLatinGreek(char) || isMathSymbol(char)) {
      return scanWord();
    }

    // If the character isn’t a Latin or Greek
    // character, then it may be a digit. And if
    // it is a digit, then we scan for numbers.
    if (isDigit(char)) {
      // If the character is `0` and
      // the next character is `b`, then
      // we’ve encountered a binary number.

      if (char === "0" && match("b")) {
        return scanBinaryNumber();
      } else {
        return scanNumber(TokenType.INT);
      }
    }

    // We check if this is a delimiter.
    switch (char) {
      case ":":
        return newToken(TokenType.COLON);
      case "&":
        return newToken(TokenType.AMPERSAND);
      case "~":
        return newToken(TokenType.TILDE);
      case "|":
        return newToken(TokenType.VBAR);
      case "(":
        return newToken(TokenType.LEFT_PAREN);
      case ")":
        return newToken(TokenType.RIGHT_PAREN);
      case "[":
        return newToken(TokenType.LEFT_BRACKET);
      case "]":
        return newToken(TokenType.RIGHT_BRACKET);
      case "{":
        return newToken(TokenType.LEFT_BRACE);
      case "}":
        return newToken(TokenType.RIGHT_BRACE);
      case ",":
        return newToken(TokenType.COMMA);
      case ".":
        return newToken(TokenType.DOT);
      case "-": {
        if (peek() === "-" && peekNext() === "-") {
          while (peek() !== "\n" && !atEnd()) {
            tick();
          }
          return Token.empty;
        } else {
          return newToken(match("-") ? TokenType.MINUS_MINUS : TokenType.MINUS);
        }
      }
      case "+":
        return newToken(match("+") ? TokenType.PLUS_PLUS : TokenType.PLUS);
      case "*":
        return newToken(TokenType.STAR);
      case ";":
        return newToken(TokenType.SEMICOLON);
      case "%":
        return newToken(TokenType.PERCENT);
      case "/":
        return newToken(TokenType.SLASH);
      case "^":
        return newToken(TokenType.CARET);
      case "=": {
        if (peek() === "=" && peekNext() === "=") {
          while (peek() === "=") {
            tick();
          }
          while (!atEnd()) {
            tick();
            if (peek() === "=" && peekNext() === "=" && lookup(2) === "=") {
              break;
            }
          }
          if (atEnd()) {
            return errorToken(
              `unterminated block comment`,
              `scanning a “=”`,
            );
          }
          while (peek() === "=") {
            tick();
          }
          return Token.empty;
        } else {
          return newToken(match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        }
      }
      // If the next character is `=`, then we
      // match the lexeme `!=`. Otherwise, we only
      // match the lexeme `!`.
      case "!":
        return newToken(match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);

      // If the next character is `=`, then we match
      // the lexeme `<=`. Otherwise, we only
      // match the lexeme `<`.
      case "<":
        return newToken(match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);

      // If the next character is `=`, then we match
      // the lexeme `>=`. Otherwise, we only
      // match the lexeme `>`.
      case ">":
        return newToken(
          match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER,
        );

      // special handling for strings
      case `"`:
        return scanString();
    }
    return errorToken(
      `unknown token: “${char}”`,
      `scanning for tokens`,
    );
  };

  const stream = () => {
    const out: Token[] = [];
    let prev = Token.empty;
    let now = scan();
    if (!now.isEmpty()) {
      out.push(now);
    } else if ($error !== null) {
      return left($error);
    }
    let peek = scan();
    if ($error !== null) {
      return left($error);
    }
    while (!atEnd()) {
      prev = now;
      now = peek;
      const t = scan();
      if ($error !== null) {
        return left($error);
      }
      if (t.isEmpty()) {
        continue;
      } else {
        peek = t;
      }
      if (
        prev.isRightDelimiter() && now.is(TokenType.COMMA) &&
        peek.isRightDelimiter()
      ) {
        continue;
      }
      out.push(now);
    }
    out.push(peek);
    if (out.length && !out[out.length - 1].is(TokenType.END)) {
      out.push(token(
        TokenType.END,
        "END",
        null,
        $line,
        $column,
      ));
    }
    return right(out);
  };

  const isDone = () => (
    $current >= code.length
  );

  return {
    stream,
    scan,
    isDone,
  };
}

interface Visitor<T> {
  intExpr(expr: IntExpr): T;
  floatExpr(expr: FloatExpr): T;
  fracExpr(expr: FracExpr): T;
  scinumExpr(expr: ScinumExpr): T;
  numConstExpr(expr: NumericConstExpr): T;
  nilExpr(expr: NilExpr): T;
  stringExpr(expr: StringExpr): T;
  booleanExpr(expr: BooleanExpr): T;
  indexingExpr(expr: IndexingExpr): T;
  tupleExpr(expr: TupleExpr): T;
  vectorExpr(expr: VectorExpr): T;
  setExpr(expr: SetExpr): T;
  matrixExpr(expr: MatrixExpr): T;
  assignExpr(expr: AssignExpr): T;
  binaryExpr(expr: BinaryExpr): T;
  logicalBinaryExpr(expr: LogicalBinaryExpr): T;
  relationExpr(expr: RelationExpr): T;
  callExpr(expr: CallExpr): T;
  groupExpr(expr: GroupExpr): T;
  unaryExpr(expr: UnaryExpr): T;
  variableExpr(expr: VariableExpr): T;
  getExpr(expr: PropGetExpr): T;
  propSetExpr(expr: PropSetExpr): T;
  thisExpr(expr: ThisExpr): T;
  printStmt(stmt: PrintStmt): T;
  varDefStmt(stmt: VarDefStmt): T;
  whileStmt(stmt: WhileStmt): T;
  blockStmt(stmt: BlockStmt): T;
  returnStmt(stmt: ReturnStmt): T;
  expressionStmt(stmt: ExprStmt): T;
  fnDefStmt(stmt: FnDefStmt): T;
  classStmt(stmt: ClassStmt): T;
  conditionalStmt(stmt: ConditionalStmt): T;
}

/**
 * A type corresponding to a node’s
 * kind.
 */
enum NodeKind {
  int,
  float,
  fraction,
  scinum,
  nil,
  string,
  boolean,
  numeric_constant,
  assignExpr,
  binaryExpr,
  callExpr,
  relationExpr,
  setExpr,
  groupExpr,
  logicalBinaryExpr,
  unaryExpr,
  indexingExpr,
  tupleExpr,
  vectorExpr,
  matrixExpr,
  variableExpr,
  getExpr,
  propSetExpr,
  thisExpr,
  blockStmt,
  exprStmt,
  fnDefStmt,
  varDefStmt,
  condStmt,
  printStmt,
  whileStmt,
  returnStmt,
  classStmt,
}

/**
 * A class corresponding to an ASTNode.
 */
abstract class ASTNode {
  abstract kind(): NodeKind;
  abstract accept<T>(Visitor: Visitor<T>): T;
}

/**
 * A class corresponding to an expression node.
 */
abstract class Expr extends ASTNode {
}

/**
 * A class corresponding to a nil literal expression.
 */
class NilExpr extends Expr {
  $value: null = null;
  constructor() {
    super();
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.nilExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.nil;
  }
}

/**
 * Returns a new null literal node.
 */
const nil = () => (new NilExpr());

/**
 * A class corresponding to an integer literal expression.
 */
class IntExpr extends Expr {
  $value: number;
  constructor(value: number) {
    super();
    this.$value = floor(value);
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.intExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.int;
  }
}

/**
 * Returns a new integer literal node.
 */
const intExpr = (value: number) => (
  new IntExpr(value)
);

/**
 * A class corresponding to a numeric constant expression.
 */
class NumericConstExpr extends Expr {
  $sym: string;
  $value: number;
  constructor(sym: string, value: number) {
    super();
    this.$sym = sym;
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.numConstExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.numeric_constant;
  }
}

/** Returns a new NaN literal. */
const numConst = (
  sym: string,
  value: number,
) => (new NumericConstExpr(sym, value));

/**
 * A class corresponding to an float literal expression.
 */
class FloatExpr extends Expr {
  $value: number;
  constructor(value: number) {
    super();
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.floatExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.float;
  }
}

/**
 * A class corresponding to a fraction literal expression.
 */
class FracExpr extends Expr {
  $value: Fraction;
  constructor(value: Fraction) {
    super();
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.fracExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.fraction;
  }
}

/**
 * Returns a new fraction literal node.
 */
const fracExpr = (value: Fraction) => (
  new FracExpr(value)
);

/**
 * A class corresponding to a scientific
 * number literal node.
 */
class ScinumExpr extends Expr {
  $value: Scinum;
  constructor(value: Scinum) {
    super();
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.scinumExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.scinum;
  }
}

/**
 * Returns a new scientific number literal node.
 */
const scinumExpr = (value: Scinum) => (
  new ScinumExpr(value)
);

/**
 * Returns a new float literal node.
 */
const float = (value: number) => (
  new FloatExpr(value)
);

/** A class corresponding to an Assignment node. */
class AssignExpr extends Expr {
  $name: VariableExpr;
  $value: Expr;
  constructor(name: VariableExpr, value: Expr) {
    super();
    this.$name = name;
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.assignExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.assignExpr;
  }
}

/**
 * Returns a new assignment node.
 */
const assign = (name: VariableExpr, value: Expr) => (
  new AssignExpr(name, value)
);

/**
 * A class corresponding to a string literal expression.
 */
class StringExpr extends Expr {
  $value: string;
  constructor(value: string) {
    super();
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.stringExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.string;
  }
}

/**
 * Returns a new string literal expression.
 */
const str = (value: string) => (
  new StringExpr(value)
);

class BooleanExpr extends Expr {
  $value: boolean;
  constructor(value: boolean) {
    super();
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.booleanExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.boolean;
  }
}

const bool = (value: boolean) => (
  new BooleanExpr(value)
);

/**
 * A node corresponding to an
 * indexing expression.
 */
class IndexingExpr extends Expr {
  $list: Expr;
  $index: Expr;
  $leftBracket: Token;
  constructor(list: Expr, index: Expr, leftBracket: Token) {
    super();
    this.$list = list;
    this.$index = index;
    this.$leftBracket = leftBracket;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.indexingExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.indexingExpr;
  }
}

/**
 * Returns a new indexing expression node.
 */
const indexingExpr = (list: Expr, index: Expr, leftBracket: Token) => (
  new IndexingExpr(list, index, leftBracket)
);

/**
 * A node corresponding to a tuple
 * expression.
 */
class TupleExpr extends Expr {
  $elements: Expr[];
  $leftParen: Token;
  constructor(elements: Expr[], leftParen: Token) {
    super();
    this.$elements = elements;
    this.$leftParen = leftParen;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.tupleExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.tupleExpr;
  }
}

/**
 * Returns a new tuple expression node.
 */
const tupleExpr = (elements: Expr[], leftParen: Token) => (
  new TupleExpr(elements, leftParen)
);

/**
 * A node corresponding to a vector
 * expression.
 */
class VectorExpr extends Expr {
  $elements: Expr[];
  $leftBracket: Token;
  constructor(elements: Expr[], leftBracket: Token) {
    super();
    this.$elements = elements;
    this.$leftBracket = leftBracket;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.vectorExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.vectorExpr;
  }
}

/**
 * Returns a new vector expression node.
 */
const vectorExpr = (elements: Expr[], leftBracket: Token) => (
  new VectorExpr(elements, leftBracket)
);

/**
 * Returns true, and asserts,
 * if the given node is a vector expression.
 */
const isVectorExpr = (node: ASTNode): node is VectorExpr => (
  node.kind() === NodeKind.vectorExpr
);

/**
 * A node corresponding to a matrix expression.
 */
class MatrixExpr extends Expr {
  $vectors: VectorExpr[];
  $rows: number;
  $columns: number;
  $leftBracket: Token;
  constructor(
    vectors: VectorExpr[],
    rows: number,
    columns: number,
    leftBracket: Token,
  ) {
    super();
    this.$vectors = vectors;
    this.$rows = rows;
    this.$columns = columns;
    this.$leftBracket = leftBracket;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.matrixExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.matrixExpr;
  }
}

/**
 * Returns a new matrix expression node.
 */
const matrixExpr = (
  vectors: VectorExpr[],
  rows: number,
  columns: number,
  leftBracket: Token,
) => (
  new MatrixExpr(vectors, rows, columns, leftBracket)
);

class SetExpr extends Expr {
  $elements: Expr[];
  $leftBrace: Token;
  constructor(elements: Expr[], leftBrace: Token) {
    super();
    this.$elements = elements;
    this.$leftBrace = leftBrace;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.setExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.setExpr;
  }
}
const setExpr = (elements: Expr[], leftBrace: Token) => (
  new SetExpr(elements, leftBrace)
);

/** A class corresponding to a binary expression. */
class BinaryExpr extends Expr {
  /** The left operand of this binary expression. */
  $left: Expr;

  /** The operator of this binary expression. */
  $op: Token;

  /** The right operand of this binary expression. */
  $right: Expr;
  constructor(left: Expr, op: Token, right: Expr) {
    super();
    this.$left = left;
    this.$op = op;
    this.$right = right;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.binaryExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.binaryExpr;
  }
}

/**
 * Returns a new binary expression node.
 */
const binex = (left: Expr, op: Token, right: Expr) => (
  new BinaryExpr(left, op, right)
);

/**
 * A class corresponding to a logical binary expression.
 */
class LogicalBinaryExpr extends Expr {
  /** The left operand of this logical binary expression. */
  $left: Expr;

  /** The operator of this logical binary expression. */
  $op: Token;

  /** The right operand of this logical binary expression. */
  $right: Expr;
  constructor(left: Expr, op: Token, right: Expr) {
    super();
    this.$left = left;
    this.$op = op;
    this.$right = right;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.logicalBinaryExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.logicalBinaryExpr;
  }
}

/**
 * Returns a new logical binary expression node.
 */
const logicalBinex = (left: Expr, op: Token, right: Expr) => (
  new LogicalBinaryExpr(left, op, right)
);

/**
 * A class corresponding to a relation expression.
 */
class RelationExpr extends Expr {
  /** The left operand of this relation expression. */
  $left: Expr;

  /** The operator of this relation expression. */
  $op: Token;

  /** The right operand of this relation expression. */
  $right: Expr;
  constructor(left: Expr, op: Token, right: Expr) {
    super();
    this.$left = left;
    this.$op = op;
    this.$right = right;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.relationExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.relationExpr;
  }
}

/**
 * Returns a new relation expression.
 */
const relationExpr = (left: Expr, op: Token, right: Expr) => (
  new RelationExpr(left, op, right)
);

/**
 * A class corresponding to a unary expression.
 * There are only two unary expressions in Woven:
 *
 * 1. the not-expression ('not'), and
 * 2. the factorial-expression ('!')
 */
class UnaryExpr extends Expr {
  $op: Token;
  $arg: Expr;
  constructor(op: Token, arg: Expr) {
    super();
    this.$op = op;
    this.$arg = arg;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.unaryExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.unaryExpr;
  }
}

/**
 * Returns a new unary expression node.
 */
const unaryExpr = (op: Token, arg: Expr) => (
  new UnaryExpr(op, arg)
);

/**
 * A class corresponding to a function call expression.
 */
class CallExpr extends Expr {
  $callee: Expr;
  $paren: Token;
  $args: Expr[];
  constructor(callee: Expr, args: Expr[], paren: Token) {
    super();
    this.$callee = callee;
    this.$paren = paren;
    this.$args = args;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.callExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.callExpr;
  }
}

/**
 * Returns new function call expression.
 */
const callExpr = (callee: Expr, args: Expr[], paren: Token) => (
  new CallExpr(callee, args, paren)
);

/**
 * A class corresponding to a parenthesized expression.
 */
class GroupExpr extends Expr {
  $inner: Expr;
  constructor(innerExpression: Expr) {
    super();
    this.$inner = innerExpression;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.groupExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.groupExpr;
  }
}

/**
 * Returns a new parenthesized expression node.
 */
const groupExpr = (innerExpression: Expr) => (
  new GroupExpr(innerExpression)
);

/**
 * A class corresponding to a variable node.
 */
class VariableExpr extends Expr {
  $name: Token;
  constructor(name: Token) {
    super();
    this.$name = name;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.variableExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.variableExpr;
  }
}
const variable = (name: Token) => (
  new VariableExpr(name)
);
/**
 * Returns true, and asserts, if the
 * given node is a variable expression
 * (i.e., an identifier) node.
 */
const isVariable = (node: ASTNode): node is VariableExpr => (
  node.kind() === NodeKind.variableExpr
);

/**
 * A node corresponding to a get-expression.
 */
class PropGetExpr extends Expr {
  $object: Expr;
  $name: Token;
  constructor(object: Expr, name: Token) {
    super();
    this.$object = object;
    this.$name = name;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.getExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.getExpr;
  }
}

/**
 * Returns a new get-expression node.
 */
const getExpr = (object: Expr, name: Token) => (
  new PropGetExpr(object, name)
);

const isGetExpr = (node: ASTNode): node is PropGetExpr => (
  node.kind() === NodeKind.getExpr
);

/**
 * A node corresponding to a property-set-expression.
 */
class PropSetExpr extends Expr {
  $object: Expr;
  $name: Token;
  $value: Expr;
  constructor(object: Expr, name: Token, value: Expr) {
    super();
    this.$object = object;
    this.$name = name;
    this.$value = value;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.propSetExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.propSetExpr;
  }
}

/**
 * Returns a new property-set-expression node.
 */
const propSetExpr = (object: Expr, name: Token, value: Expr) => (
  new PropSetExpr(object, name, value)
);

class ThisExpr extends Expr {
  $keyword: Token;
  constructor(keyword: Token) {
    super();
    this.$keyword = keyword;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.thisExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.thisExpr;
  }
}
const thisExpr = (keyword: Token) => (
  new ThisExpr(keyword)
);

abstract class Statement extends ASTNode {
}

/**
 * A class corresponding to a print statement.
 */
class PrintStmt extends Statement {
  $expr: Expr;
  $keyword: Token;
  constructor(expr: Expr, keyword: Token) {
    super();
    this.$expr = expr;
    this.$keyword = keyword;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.printStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.printStmt;
  }
}

/**
 * A node corresponding to a variable definition
 * statement.
 */
class VarDefStmt extends Statement {
  $name: Token;
  $value: Expr;
  $mutable: boolean;
  constructor(name: Token, value: Expr, mutable: boolean) {
    super();
    this.$name = name;
    this.$value = value;
    this.$mutable = mutable;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.varDefStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.varDefStmt;
  }
}

/**
 * Returns a new variable definition statement node.
 */
const varDef = (name: Token, value: Expr, mutable: boolean) => (
  new VarDefStmt(name, value, mutable)
);

/**
 * Returns a new print statement.
 */
const printStmt = (expr: Expr, keyword: Token) => (
  new PrintStmt(expr, keyword)
);

/**
 * A class corresponding to a block statement.
 */
class BlockStmt extends Statement {
  $statements: Statement[];
  constructor(statements: Statement[]) {
    super();
    this.$statements = statements;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.blockStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.blockStmt;
  }
}

/**
 * Returns a new block statement node.
 */
const blockStmt = (statements: Statement[]) => (
  new BlockStmt(statements)
);

/**
 * A node corresponding to a return
 * statement.
 */
class ReturnStmt extends Statement {
  $value: Expr;
  $keyword: Token;
  constructor(value: Expr, keyword: Token) {
    super();
    this.$value = value;
    this.$keyword = keyword;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.returnStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.returnStmt;
  }
}

/**
 * Returns a new return statement node.
 */
const returnStmt = (value: Expr, keyword: Token) => (
  new ReturnStmt(value, keyword)
);

/**
 * Returns true, and asserts,
 * that the given node is a block statement node.
 */
const isBlock = (node: ASTNode): node is BlockStmt => (
  node.kind() === NodeKind.blockStmt
);

/**
 * A node corresponding to a while-loop statement.
 */
class WhileStmt extends Statement {
  $condition: Expr;
  $body: Statement;
  constructor(condition: Expr, body: Statement) {
    super();
    this.$condition = condition;
    this.$body = body;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.whileStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.whileStmt;
  }
}

/**
 * Returns a new while-loop statement node.
 */
const whileStmt = (condition: Expr, body: Statement) => (
  new WhileStmt(condition, body)
);

/**
 * A class corresponding to an expression statement.
 */
class ExprStmt extends Statement {
  $expression: Expr;
  constructor(expression: Expr) {
    super();
    this.$expression = expression;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.expressionStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.exprStmt;
  }
}

/**
 * Returns a new expression statement.
 */
const exprStmt = (expression: Expr) => (
  new ExprStmt(expression)
);

/**
 * A class corresponding to a function
 * definition statement.
 */
class FnDefStmt extends Statement {
  $name: Token;
  $params: VariableExpr[];
  $body: Statement[];
  constructor(name: Token, params: VariableExpr[], body: Statement[]) {
    super();
    this.$name = name;
    this.$params = params;
    this.$body = body;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.fnDefStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.fnDefStmt;
  }
}

/**
 * Returns a new function definition statement
 * node.
 */
const fnDefStmt = (name: Token, params: VariableExpr[], body: Statement[]) => (
  new FnDefStmt(name, params, body)
);

class ConditionalStmt extends Statement {
  $condition: Expr;
  $then: Statement;
  $else: Statement;
  constructor(condition: Expr, thenBranch: Statement, elseBranch: Statement) {
    super();
    this.$condition = condition;
    this.$then = thenBranch;
    this.$else = elseBranch;
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.conditionalStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.condStmt;
  }
}

/**
 * Returns a new conditional statement node.
 */
const conditionalStmt = (
  condition: Expr,
  thenBranch: Statement,
  elseBranch: Statement,
) => (
  new ConditionalStmt(condition, thenBranch, elseBranch)
);

/** A class declaration statement node. */
class ClassStmt extends Statement {
  $name: Token;
  $methods: FnDefStmt[];
  constructor(name: Token, methods: FnDefStmt[]) {
    super();
    this.$name = name;
    this.$methods = methods;
  }
  accept<T>(Visitor: Visitor<T>): T {
    return Visitor.classStmt(this);
  }
  kind(): NodeKind {
    return NodeKind.classStmt;
  }
}

/** Returns a new class declaration statement node. */
const classStmt = (name: Token, methods: FnDefStmt[]) => (
  new ClassStmt(name, methods)
);

enum BP {
  NONE,
  LOWEST,
  STRINGOP,
  ASSIGN,
  LITERAL,
  OR,
  NOR,
  AND,
  NAND,
  XOR,
  XNOR,
  NOT,
  EQUALITY,
  RELATION,
  SUM,
  DIFFERENCE,
  PRODUCT,
  QUOTIENT,
  IMUL,
  POWER,
  POSTFIX,
  CALL,
}

/**
 * A type corresponding to a parsing rule.
 */
type ParseRule<T> = (token: Token, lastNode: T) => Either<Err, T>;

/**
 * A type correspondign to a table
 * of parse rules.
 * The table takes the form:
 * ~~~
 * {
 *   T: [P1, P2, BP]
 * }
 * ~~~
 * where T is a TokenType,
 * P1 is a ParseRule corresponding to a prefix rule,
 * P2 is a ParseRule corresponding to an infix rule, and
 * P3 is a ParseRule corresponding to a postfix rule.
 */
type ParseRuleTable<T> = Record<
  TokenType,
  [ParseRule<T>, ParseRule<T>, BP]
>;

class ParserState {
  /** The token currently being parsed. */
  $current: Token = Token.empty;

  /** The token immediately after the current token. */
  $peek: Token = Token.empty;

  /** The lexical analyzer. */
  $lexer: ReturnType<typeof lexicalAnalysis>;

  /**
   * This field stores the parser state’s error,
   * defaulting to null. If this field is not null,
   * then an error occurred.
   */
  $error: null | Err = null;

  /**
   * Moves the lexer forward and
   * returns the current token.
   */
  next() {
    this.$current = this.$peek;
    const nextToken = this.$lexer.scan();
    if (nextToken.isErrorToken()) {
      this.$error = nextToken.$literal;
      return Token.END();
    }
    this.$peek = nextToken;
    return this.$current;
  }

  /**
   * Returns a Left<Err> and sets
   * the `$error` field of the parser
   * state.
   */
  error(message: string, phase: string) {
    const err = syntaxError(
      message,
      phase,
      this.$current.$line,
      this.$current.$column,
    );
    this.$error = err;
    return left(err);
  }

  /**
   * Returns true if the next token
   * is of the given type, false otherwise.
   * If it is of the given type, the scaner
   * is moved forward.
   */
  nextIs(type: TokenType) {
    if (this.$peek.is(type)) {
      this.next();
      return true;
    }
    return false;
  }

  /**
   * Returns true if the upcoming token
   * is of the given type.
   */
  check(type: TokenType) {
    if (this.atEnd()) {
      return false;
    } else {
      return this.$peek.is(type);
    }
  }

  /**
   * Returns true if the parser must
   * halt. There are two conditions
   * warranting a parsing halt:
   *
   * 1. The lexer has reached the end of file, or
   * 2. the parser state has encountered an error.
   */
  atEnd() {
    return (
      this.$peek.is(TokenType.END) ||
      this.$error !== null
    );
  }

  /**
   * Returns true if the parser can assume
   * there exists a semicolon. In Woven,
   * there are two situations where we
   * assume a semicolon:
   *
   * 1. If we’ve reached the end of the code.
   * 2. The next token is an END token.
   */
  canAssumeSemicolon() {
    return (
      this.$peek.is(TokenType.END) ||
      this.$peek.is(TokenType.RIGHT_BRACE) ||
      this.atEnd()
    );
  }

  /**
   * Returns a new Right<Statement>
   */
  statement<S>(stmt: S) {
    return right(stmt);
  }
  /**
   * Returns a new Right<Expr>
   */
  expr<E>(expr: E) {
    return right(expr);
  }

  constructor(code: string) {
    this.$lexer = lexicalAnalysis(code);
    this.next();
  }
}
const enstate = (code: string) => (
  new ParserState(code)
);

function syntaxAnalysis(code: string) {
  const state = enstate(code);

  /**
   * A parse rule that parses a numeric
   * literal (a float or an integer).
   */
  const number: ParseRule<Expr> = (token) => {
    if (token.isNumericToken()) {
      if (token.is(TokenType.FLOAT)) {
        return state.expr(float(token.$literal));
      } else {
        return state.expr(intExpr(token.$literal));
      }
    } else {
      return state.error(
        `Expected an integer, but got ${token.$lexeme}`,
        `parsing an integer`,
      );
    }
  };

  /**
   * Parses a scientific number.
   */
  const scientific: ParseRule<Expr> = (token) => {
    if (token.isScientificNumber()) {
      return state.expr(scinumExpr(token.$literal));
    } else {
      return state.error(
        `Expected a scientific number literal, but got “${token.$lexeme}”`,
        `parsing a scientific number`,
      );
    }
  };

  /**
   * Parses a boolean literal.
   */
  const boolean: ParseRule<Expr> = (token) => {
    if (token.isBoolean()) {
      return state.expr(bool(token.$literal));
    } else {
      return state.error(
        `Expected a boolean literal, but got “${token.$lexeme}”`,
        `parsing a boolean expression`,
      );
    }
  };

  /**
   * Parses a numeric constant literal.
   */
  const numericConstant: ParseRule<Expr> = (token: Token) => {
    if (token.isNumericConstant()) {
      return state.expr(numConst(token.$lexeme, token.$literal));
    } else {
      return state.error(
        `Expected a numeric constant, but got “${token.$lexeme}”`,
        `parsing a numeric constant`,
      );
    }
  };

  /**
   * Parses a fraction.
   */
  const fraction: ParseRule<Expr> = (token) => {
    if (token.isFraction()) {
      return state.expr(fracExpr(token.$literal));
    } else {
      return state.error(
        `Expected a fraction literal, but got “${token.$lexeme}”`,
        `parsing a fraction`,
      );
    }
  };

  /**
   * Parses a nil literal.
   */
  const nilValue: ParseRule<Expr> = (token) => {
    if (token.isNilToken()) {
      return state.expr(nil());
    } else {
      return state.error(
        `Expected an nil literal, but got ${token.$lexeme}`,
        `parsing a nil literal`,
      );
    }
  };

  /**
   * Parses a string literal.
   */
  const string: ParseRule<Expr> = (token) => {
    if (token.isStringToken()) {
      return state.expr(str(token.$literal));
    } else {
      return state.error(
        `Expected a string literal, but got “${token.$lexeme}”`,
        `parsing a string`,
      );
    }
  };

  /**
   * Parses an identifier.
   */
  const identifier: ParseRule<Expr> = (token) => {
    if (token.isIdentifier()) {
      const out = variable(token);
      return state.expr(out);
    } else {
      return state.error(
        `Expected an identifier, but got “${token.$lexeme}”`,
        `parsing an identifier`,
      );
    }
  };

  /**
   * Parses a comparison expression.
   */
  const compare: ParseRule<Expr> = (op, lhs) => {
    return expr().chain((rhs) => {
      return state.expr(
        relationExpr(lhs, op, rhs),
      );
    });
  };

  /**
   * Parses an infix expression.
   */
  const infix: ParseRule<Expr> = (op, lhs) => {
    const rhs = expr(precOf(op.$type));
    if (rhs.isLeft()) {
      return rhs;
    }
    const out = binex(
      lhs,
      op,
      rhs.unwrap(),
    );
    return state.expr(out);
  };

  /**
   * Parses a logical infix expression.
   */
  const logicalInfix: ParseRule<Expr> = (op, lhs) => {
    const rhs = expr(precOf(op.$type));
    if (rhs.isLeft()) {
      return rhs;
    }
    const out = logicalBinex(
      lhs,
      op,
      rhs.unwrap(),
    );
    return state.expr(out);
  };

  /**
   * Parses a factorial expression.
   */
  const factorialExpression = (op: Token, arg: Expr) => {
    return state.expr(unaryExpr(op, arg));
  };

  /**
   * Parses a unary expression.
   */
  const unary: ParseRule<Expr> = (op) => {
    const p = precOf(op.$type);
    return expr(p).chain((arg) => {
      return state.expr(unaryExpr(op, arg));
    });
  };

  const setExpression: ParseRule<Expr> = (leftBrace) => {
    const elements: Expr[] = [];
    const phase = `parsing a vector expression`;
    if (!state.check(TokenType.RIGHT_BRACKET)) {
      do {
        const elem = expr();
        if (elem.isLeft()) {
          return elem;
        }
        const element = elem.unwrap();
        elements.push(element);
      } while (
        state.nextIs(TokenType.COMMA) &&
        !state.check(TokenType.RIGHT_BRACE)
      );
    }
    if (!state.nextIs(TokenType.RIGHT_BRACE)) {
      return state.error(
        `Expected a “}” to close the set`,
        phase,
      );
    }
    return state.expr(setExpr(elements, leftBrace));
  };

  const getExpression: ParseRule<Expr> = (op, lhs) => {
    const phase = `parsing a get expression`;
    const nxt = state.next();
    if (!nxt.isIdentifier()) {
      return state.error(
        `Expected a property name`,
        phase,
      );
    }
    let exp = getExpr(lhs, nxt);
    if (state.nextIs(TokenType.LEFT_PAREN)) {
      const args: Expr[] = [];
      if (!state.check(TokenType.RIGHT_PAREN)) {
        do {
          const x = expr();
          if (x.isLeft()) {
            return x;
          }
          const arg = x.unwrap();
          args.push(arg);
        } while (state.nextIs(TokenType.COMMA));
      }
      const rparen = state.next();
      if (!rparen.is(TokenType.RIGHT_PAREN)) {
        return state.error(
          `Expected “)” after the method arguments`,
          phase,
        );
      }
      return state.expr(callExpr(exp, args, op));
    }
    return state.expr(exp);
  };

  /**
   * Parses a parenthesized expression.
   */
  const primary: ParseRule<Expr> = (lparen) => {
    const innerExpr = expr();
    if (innerExpr.isLeft()) {
      return innerExpr;
    }
    if (state.nextIs(TokenType.COMMA)) {
      const elements: Expr[] = [innerExpr.unwrap()];
      if (state.nextIs(TokenType.RIGHT_PAREN)) {
        return state.expr(
          tupleExpr(elements, lparen),
        );
      }
      do {
        const elem = expr();
        if (elem.isLeft()) {
          return elem;
        }
        elements.push(elem.unwrap());
      } while (
        state.nextIs(TokenType.COMMA) && !state.check(TokenType.RIGHT_PAREN)
      );
      if (!state.nextIs(TokenType.RIGHT_PAREN)) {
        return state.error(
          `Expected a “)” to close the tuple`,
          `parsing a tuple`,
        );
      }
      return state.expr(tupleExpr(elements, lparen));
    }
    if (!state.nextIs(TokenType.RIGHT_PAREN)) {
      return state.error(
        `Expected a closing “)”`,
        `parsing a parenthesized expression`,
      );
    }
    return state.expr(groupExpr(innerExpr.unwrap()));
  };

  /**
   * Parses an assignment expression.
   */
  const assignment: ParseRule<Expr> = (op, prevNode) => {
    const phase = `parsing an assignment`;
    if (isVariable(prevNode)) {
      return expr().chain((n) => {
        return state.expr(assign(prevNode, n));
      });
    } else if (isGetExpr(prevNode)) {
      const rhs = expr();
      if (rhs.isLeft()) {
        return rhs;
      }
      return state.expr(
        propSetExpr(prevNode.$object, prevNode.$name, rhs.unwrap()),
      );
    } else {
      return state.error(
        `Expected a valid assignment target`,
        phase,
      );
    }
  };

  /**
   * Parses a decrement expression.
   */
  const decrement: ParseRule<Expr> = (op, node) => {
    if (isVariable(node)) {
      const right = binex(
        node,
        op.type(TokenType.MINUS).lexeme("-"),
        intExpr(1),
      );
      return state.expr(assign(node, right));
    } else {
      return state.error(
        `Expected the left-hand side of “--” to be either a variable or a property accessor`,
        `parsing a decrement`,
      );
    }
  };

  /**
   * Parses an increment expression.
   */
  const increment: ParseRule<Expr> = (op, node) => {
    if (isVariable(node)) {
      const right = binex(
        node,
        op.type(TokenType.PLUS).lexeme("+"),
        intExpr(1),
      );
      return state.expr(assign(node, right));
    } else {
      return state.error(
        `Expected the left-hand side of “++” to be either a variable or a property accessor`,
        `parsing an increment`,
      );
    }
  };

  /**
   * Parses a list of comma-separated expressions.
   */
  const commaSeparatedExprs = () => {
    const exprs: Expr[] = [];
    do {
      const e = expr();
      if (e.isLeft()) {
        return e;
      }
      const element = e.unwrap();
      exprs.push(element);
    } while (state.nextIs(TokenType.COMMA));
    return right(exprs);
  };

  /**
   * Parses a function call expression.
   */
  const fnCall: ParseRule<Expr> = (op, lastNode) => {
    const callee = lastNode;
    let args: Expr[] = [];
    if (!state.check(TokenType.RIGHT_PAREN)) {
      const argExprs = commaSeparatedExprs();
      if (argExprs.isLeft()) {
        return argExprs;
      }
      args = argExprs.unwrap();
    }
    if (!state.nextIs(TokenType.RIGHT_PAREN)) {
      return state.error(
        `Expected a “)” to close the arguments`,
        `parsing a function call`,
      );
    }
    const out = callExpr(callee, args, op);
    return state.expr(out);
  };

  const indexingExpression: ParseRule<Expr> = (leftBracket, lhs) => {
    const index = expr();
    if (index.isLeft()) {
      return index;
    }
    if (!state.nextIs(TokenType.RIGHT_BRACKET)) {
      return state.error(
        `Expected a “]” to close the indexing accessor`,
        `parsing an indexing expression`,
      );
    }
    return state.expr(indexingExpr(lhs, index.unwrap(), leftBracket));
  };

  /**
   * Parses a vector or matrix expression.
   */
  const vectorExpression: ParseRule<Expr> = (leftBracket) => {
    const elements: Expr[] = [];
    const vectors: VectorExpr[] = [];
    const phase = `parsing a vector expression`;
    let rows = 0;
    let columns = 0;
    let didParseMatrix = false;
    if (!state.check(TokenType.RIGHT_BRACKET)) {
      do {
        const elem = expr();
        if (elem.isLeft()) {
          return elem;
        }
        const element = elem.unwrap();
        if (isVectorExpr(element)) {
          rows++;
          if (!didParseMatrix) {
            columns = element.$elements.length;
            didParseMatrix = true;
          }
          if (columns !== element.$elements.length) {
            return state.error(
              `Encountered a jagged matrix. Jagged matrices are not permitted. For nested lists of arbitrary lengths, consider using a tuple.`,
              phase,
            );
          }
          vectors.push(element);
        } else {
          elements.push(element);
        }
      } while (
        state.nextIs(TokenType.COMMA) &&
        !state.check(TokenType.RIGHT_BRACKET)
      );
    }
    if (!state.nextIs(TokenType.RIGHT_BRACKET)) {
      return state.error(
        `Expected a “]” to close the vector`,
        phase,
      );
    }
    if (vectors.length !== 0) {
      return state.expr(matrixExpr(vectors, rows, columns, leftBracket));
    }
    return state.expr(vectorExpr(elements, leftBracket));
  };

  const thisExpression: ParseRule<Expr> = (keyword) => {
    return state.expr(thisExpr(keyword));
  };

  /**
   * Alias for BP.NONE, corresponding
   * to a binding power of nothing.
   * This is used purely as a placeholder
   * for the ParseRuleTable.
   */
  const ___o = BP.NONE;

  /**
   * A parse rule that always returns an
   * error. This is used purely as a
   * placeholder for empty slots in the
   * parse rules table.
   */
  const ___: ParseRule<Expr> = (t) => {
    if (state.$error !== null) {
      return left(state.$error);
    } else {
      return state.error(
        `Unexpected lexeme: ${t.$lexeme}`,
        `expression`,
      );
    }
  };

  const rules: ParseRuleTable<Expr> = {
    // Literals
    [TokenType.INT]: [number, ___, BP.LITERAL],
    [TokenType.FLOAT]: [number, ___, BP.LITERAL],
    [TokenType.STRING]: [string, ___, BP.LITERAL],
    [TokenType.NIL]: [nilValue, ___, BP.LITERAL],
    [TokenType.SCIENTIFIC_NUMBER]: [scientific, ___, BP.LITERAL],
    [TokenType.FRACTION]: [fraction, ___, BP.LITERAL],
    [TokenType.TRUE]: [boolean, ___, BP.LITERAL],
    [TokenType.FALSE]: [boolean, ___, BP.LITERAL],
    [TokenType.IDENTIFIER]: [identifier, ___, BP.LITERAL],
    [TokenType.NUMERIC_CONSTANT]: [numericConstant, ___, BP.LITERAL],

    // Assignment Operator
    [TokenType.EQUAL]: [___, assignment, BP.ASSIGN],

    // Algebraic Infix Operators
    [TokenType.PLUS]: [___, infix, BP.SUM],
    [TokenType.MINUS]: [unary, infix, BP.DIFFERENCE],
    [TokenType.STAR]: [___, infix, BP.PRODUCT],
    [TokenType.PERCENT]: [___, infix, BP.PRODUCT],
    [TokenType.SLASH]: [___, infix, BP.QUOTIENT],
    [TokenType.REM]: [___, infix, BP.QUOTIENT],
    [TokenType.MOD]: [___, infix, BP.QUOTIENT],
    [TokenType.DIV]: [___, infix, BP.QUOTIENT],
    [TokenType.CARET]: [___, infix, BP.POWER],

    // Algebraic Postfix Operator
    [TokenType.BANG]: [___, factorialExpression, BP.POSTFIX],

    // String Infix Operator
    [TokenType.AMPERSAND]: [___, infix, BP.STRINGOP],

    // Special Assign Operators
    [TokenType.PLUS_PLUS]: [___, increment, BP.POSTFIX],
    [TokenType.MINUS_MINUS]: [___, decrement, BP.POSTFIX],

    // Logical Infix Operators
    [TokenType.AND]: [___, logicalInfix, BP.AND],
    [TokenType.OR]: [___, logicalInfix, BP.OR],
    [TokenType.NOR]: [___, logicalInfix, BP.NOR],
    [TokenType.XOR]: [___, logicalInfix, BP.XOR],
    [TokenType.XNOR]: [___, logicalInfix, BP.XNOR],
    [TokenType.NAND]: [___, logicalInfix, BP.NAND],

    // Logical Prefix Operator
    [TokenType.NOT]: [unary, ___, BP.NOT],

    // Comparison Operators
    [TokenType.EQUAL_EQUAL]: [___, compare, BP.EQUALITY],
    [TokenType.BANG_EQUAL]: [___, compare, BP.RELATION],
    [TokenType.LESS]: [___, compare, BP.RELATION],
    [TokenType.GREATER]: [___, compare, BP.RELATION],
    [TokenType.LESS_EQUAL]: [___, compare, BP.RELATION],
    [TokenType.GREATER_EQUAL]: [___, compare, BP.RELATION],

    // Parenthesized Expressions
    [TokenType.LEFT_PAREN]: [primary, fnCall, BP.CALL],
    [TokenType.RIGHT_PAREN]: [___, ___, ___o],

    // Vectors and indexing
    [TokenType.LEFT_BRACKET]: [vectorExpression, indexingExpression, BP.CALL],

    // Property access (get-expression)
    [TokenType.DOT]: [___, getExpression, BP.CALL],

    // Not handled by the Pratt parsing function (`expr`).
    [TokenType.LEFT_BRACE]: [setExpression, ___, BP.LITERAL],
    [TokenType.RIGHT_BRACE]: [___, ___, ___o], // Handled by block statement
    [TokenType.RIGHT_BRACKET]: [___, ___, ___o],
    [TokenType.COMMA]: [___, ___, ___o], // Handled by various parsers
    [TokenType.COLON]: [___, ___, ___o],
    [TokenType.SEMICOLON]: [___, ___, ___o], // Handled by statement parsers
    [TokenType.VBAR]: [___, ___, ___o], // Scanned as part of a fraction
    [TokenType.TILDE]: [___, ___, ___o],
    [TokenType.CLASS]: [___, ___, ___o],
    [TokenType.IF]: [___, ___, ___o], // Handled by `ifStatement`
    [TokenType.ELSE]: [___, ___, ___o], // Handled by `ifStatement`
    [TokenType.FOR]: [___, ___, ___o], // Handled by `forLoopStatement`
    [TokenType.FN]: [___, ___, ___o], // Handled by `fnDefStatement`
    [TokenType.PRINT]: [___, ___, ___o], // Handled by `printStatement`
    [TokenType.RETURN]: [___, ___, ___o], // Handled by `returnStatement`
    [TokenType.SUPER]: [___, ___, ___o],
    [TokenType.THIS]: [thisExpression, ___, ___o],
    [TokenType.LET]: [___, ___, ___o], // Handled by `varDefStatement`
    [TokenType.WHILE]: [___, ___, ___o], // Handled by `whileStatement`
    [TokenType.VAR]: [___, ___, ___o], // Handled by `varDefStatement`
    [TokenType.ERROR]: [___, ___, ___o],
    [TokenType.EMPTY]: [___, ___, ___o],
    [TokenType.END]: [___, ___, ___o],
  };

  /**
   * Returns the prefix rule associated
   * with the given token type.
   */
  const prefixRule = (type: TokenType): ParseRule<Expr> => (
    rules[type][0]
  );

  /**
   * Returns the infix rule associated
   * with the given token type.
   */
  const infixRule = (type: TokenType): ParseRule<Expr> => (
    rules[type][1]
  );

  /**
   * Returns the precedence of the given
   * token type.
   */
  const precOf = (type: TokenType): BP => (
    rules[type][2]
  );

  /**
   * Performs a Pratt parsing for an
   * expression.
   */
  const expr = (minBP: BP = BP.LOWEST) => {
    let token = state.next();
    const prefix = prefixRule(token.$type);
    let lhs = prefix(token, nil());
    if (lhs.isLeft()) {
      return lhs;
    }
    while (minBP < precOf(state.$peek.$type)) {
      if (state.atEnd()) {
        break;
      }
      token = state.next();
      const infix = infixRule(token.$type);
      const rhs = infix(token, lhs.unwrap());
      if (rhs.isLeft()) {
        return rhs;
      }
      lhs = rhs;
    }
    return lhs;
  };

  /**
   * Parses a variable definition statement.
   */
  const varDefStatement = (type: TokenType.LET | TokenType.VAR) => {
    const phase = `parsing a variable declaration`;
    const name = state.next();
    if (!name.isIdentifier()) {
      return state.error(
        `Expected a valid identifier`,
        phase,
      );
    }
    if (!state.nextIs(TokenType.EQUAL)) {
      return state.error(
        `Expected an assignment operator “=” after the identifier`,
        phase,
      );
    }
    const init = expressionStatement();
    if (init.isLeft()) {
      return init;
    }
    const value = init.unwrap();
    return state.statement(
      varDef(name, value.$expression, type === TokenType.VAR),
    );
  };

  /**
   * Parses a function definition statement.
   */
  const fnDefStatement = () => {
    const phase = `parsing a function declaration`;
    const name = state.next();
    if (!name.isIdentifier()) {
      return state.error(
        `Expected a valid identifier for the function’s name`,
        phase,
      );
    }
    if (!state.nextIs(TokenType.LEFT_PAREN)) {
      return state.error(
        `Expected a “(” to begin the parameters`,
        phase,
      );
    }
    const params: VariableExpr[] = [];
    if (!state.$peek.is(TokenType.RIGHT_PAREN)) {
      do {
        const expression = state.next();
        if (!expression.isIdentifier()) {
          return state.error(
            `Expected a valid identifier as a parameter`,
            phase,
          );
        }
        params.push(variable(expression));
      } while (state.nextIs(TokenType.COMMA));
    }
    if (!state.nextIs(TokenType.RIGHT_PAREN)) {
      return state.error(
        `Expected a “)” to close the parameters`,
        phase,
      );
    }
    if (state.nextIs(TokenType.EQUAL)) {
      const body = expressionStatement();
      if (body.isLeft()) {
        return body;
      }
      return state.statement(
        fnDefStmt(name, params, [body.unwrap()]),
      );
    }
    if (!state.nextIs(TokenType.LEFT_BRACE)) {
      return state.error(
        `Expected a “{” to open the function’s body`,
        phase,
      );
    }
    const body = blockStatement();
    return body.chain((b) =>
      state.statement(fnDefStmt(
        name,
        params,
        b.$statements,
      ))
    );
  };

  /**
   * Parses a return statement.
   */
  const returnStatement = () => {
    const returnKeyword = state.$current;
    const out = expressionStatement();
    if (out.isLeft()) {
      return out;
    }
    return state.statement(returnStmt(
      out.unwrap().$expression,
      returnKeyword,
    ));
  };

  /**
   * Parses a for-loop statement.
   */
  const forLoopStatement = () => {
    const phase = `parsing a for-loop`;
    const preclauseToken = state.next();
    if (!preclauseToken.is(TokenType.LEFT_PAREN)) {
      return state.error(
        `Expected a “(” after “for” to begin the loop's clauses.`,
        phase,
      );
    }
    let init: Statement | null = null;
    if (state.nextIs(TokenType.SEMICOLON)) {
      init = init;
    } else if (state.nextIs(TokenType.VAR)) {
      const initializer = varDefStatement(TokenType.VAR);
      if (initializer.isLeft()) {
        return initializer;
      }
      init = initializer.unwrap();
    } else if (state.nextIs(TokenType.LET)) {
      return state.error(
        `The variable initializer must be declared with “var”, since the initializer will mutate.`,
        phase,
      );
    } else {
      const exp = expressionStatement();
      if (exp.isLeft()) {
        return exp;
      }
      init = exp.unwrap();
    }
    let condition: Expr | null = null;
    if (!state.check(TokenType.SEMICOLON)) {
      const c = expr();
      if (c.isLeft()) {
        return c;
      }
      condition = c.unwrap();
    }
    const postConditionToken = state.next();
    if (!postConditionToken.is(TokenType.SEMICOLON)) {
      return state.error(
        `Expected a “;” after the for-loop condition`,
        phase,
      );
    }
    let increment: Expr | null = null;
    if (!state.check(TokenType.LEFT_PAREN)) {
      const inc = expr();
      if (inc.isLeft()) {
        return inc;
      }
      increment = inc.unwrap();
    }
    const postIncrementToken = state.next();
    if (!postIncrementToken.is(TokenType.RIGHT_PAREN)) {
      return state.error(
        `Expected a “)” to close the for-loop’s clauses`,
        phase,
      );
    }
    const b = statement();
    if (b.isLeft()) {
      return b;
    }
    let body = b.unwrap();
    if (increment !== null) {
      if (isBlock(body)) {
        body.$statements.push(exprStmt(increment));
      } else {
        body = blockStmt([body, exprStmt(increment)]);
      }
    }
    let loopCondition: Expr = bool(true);
    if (condition !== null) {
      loopCondition = condition;
    }
    body = whileStmt(loopCondition, body);
    if (init !== null) {
      body = blockStmt([init, body]);
    }
    return state.statement(body);
  };

  /**
   * Parses a while-loop statement.
   */
  const whileStatement = () => {
    const phase = `parsing a while loop`;
    const loopCondition = expr();
    if (loopCondition.isLeft()) {
      return loopCondition;
    }
    if (!state.nextIs(TokenType.LEFT_BRACE)) {
      return state.error(
        `Expected a block after the while-loop’s condition`,
        phase,
      );
    }
    const body = blockStatement();
    if (body.isLeft()) {
      return body;
    }
    return state.statement(whileStmt(
      loopCondition.unwrap(),
      body.unwrap(),
    ));
  };

  /**
   * Parses a conditional statement.
   */
  const conditionalStatement = () => {
    const phase = `parsing a conditional statement`;
    const c = expr();
    if (c.isLeft()) {
      return c;
    }
    const condition = c.unwrap();
    if (!state.nextIs(TokenType.LEFT_BRACE)) {
      return state.error(
        `Expected a “{” to begin the consequent block`,
        phase,
      );
    }
    const consequent = blockStatement();
    if (consequent.isLeft()) {
      return consequent;
    }
    const thenBranch = consequent.unwrap();
    let elseBranch: Statement = exprStmt(nil());
    if (state.nextIs(TokenType.ELSE)) {
      const _else = statement();
      if (_else.isLeft()) {
        return _else;
      }
      elseBranch = _else.unwrap();
    }
    return state.statement(conditionalStmt(
      condition,
      thenBranch,
      elseBranch,
    ));
  };

  /**
   * Parses a block statement.
   */
  const blockStatement = () => {
    const statements: Statement[] = [];
    while (!state.atEnd() && !state.check(TokenType.RIGHT_BRACE)) {
      const stmt = statement();
      if (stmt.isLeft()) {
        return stmt;
      }
      statements.push(stmt.unwrap());
    }
    if (!state.nextIs(TokenType.RIGHT_BRACE)) {
      return state.error(
        `Expected a “}” to close the block`,
        `parsing a block statement`,
      );
    }
    state.nextIs(TokenType.SEMICOLON);
    return state.statement(blockStmt(statements));
  };

  /**
   * Parses a print statement.
   */
  const printStatement = () => {
    const keyword = state.$current;
    const arg = expressionStatement();
    return arg.map((expr) => printStmt(expr, keyword));
  };

  /**
   * Parses an expression statement.
   */
  const expressionStatement = (): Either<Err, ExprStmt> => {
    const out = expr();
    if (out.isLeft()) {
      return out;
    }
    const expression = out.unwrap();
    if (state.nextIs(TokenType.SEMICOLON) || state.canAssumeSemicolon()) {
      return state.statement(exprStmt(expression));
    }
    return state.error(
      `Expected a “;” to end the statement`,
      `parsing an expression statement`,
    );
  };

  const classDeclaration = () => {
    const phase = `parsing a class declaration`;
    const name = state.next();
    if (!name.isIdentifier()) {
      return state.error(
        `Expected a class name after class, but got “${name.$lexeme}”`,
        phase,
      );
    }
    const lbrace = state.next();
    if (!lbrace.is(TokenType.LEFT_BRACE)) {
      return state.error(
        `Expected a “{” to begin the class declaration body`,
        phase,
      );
    }
    const methods = [];
    while (!state.check(TokenType.RIGHT_BRACE) && !state.atEnd()) {
      const f = fnDefStatement();
      if (f.isLeft()) {
        return f;
      }
      methods.push(f.unwrap());
    }
    const postMethodsToken = state.next();
    if (!postMethodsToken.is(TokenType.RIGHT_BRACE)) {
      return state.error(
        `Expected a “}” to close the class declaration body`,
        phase,
      );
    }
    return state.statement(classStmt(name, methods));
  };

  /**
   * Parses a statement.
   */
  const statement = (): Either<Err, Statement> => {
    if (state.nextIs(TokenType.IF)) {
      return conditionalStatement();
    } else if (state.nextIs(TokenType.CLASS)) {
      return classDeclaration();
    } else if (state.nextIs(TokenType.FN)) {
      return fnDefStatement();
    } else if (state.nextIs(TokenType.WHILE)) {
      return whileStatement();
    } else if (state.nextIs(TokenType.FOR)) {
      return forLoopStatement();
    } else if (state.nextIs(TokenType.LEFT_BRACE)) {
      return blockStatement();
    } else if (state.nextIs(TokenType.LET)) {
      return varDefStatement(TokenType.LET);
    } else if (state.nextIs(TokenType.RETURN)) {
      return returnStatement();
    } else if (state.nextIs(TokenType.VAR)) {
      return varDefStatement(TokenType.VAR);
    } else if (state.nextIs(TokenType.PRINT)) {
      return printStatement();
    } else {
      return expressionStatement();
    }
  };

  return {
    /**
     * Returns the statements parsed
     * from the given code.
     */
    statements() {
      if (state.$error !== null) {
        return left(state.$error);
      }
      const statements: Statement[] = [];
      while (!state.atEnd()) {
        const result = statement();
        if (result.isLeft()) {
          return result;
        }
        statements.push(result.unwrap());
      }
      return right(statements);
    },
  };
}

type RuntimeValue =
  | Primitive
  | Callable
  | ReturnValue
  | Vector
  | Matrix
  | KlassInstance
  | Fn
  | MSet<RuntimeValue>
  | RuntimeValue[];

class Environment<T> {
  $values: Map<string, T>;
  $enclosing: Environment<T> | null;
  constructor(enclosing: Environment<T> | null) {
    this.$values = new Map<string, T>();
    this.$enclosing = enclosing;
  }
  ancestor(distance: number) {
    // @ts-ignore
    let env = this;
    for (let i = 0; i < distance; i++) {
      // @ts-ignore
      env = this.$enclosing;
    }
    return env;
  }
  assignAt(distance: number, name: string, value: T): T {
    this.ancestor(distance).$values.set(name, value);
    return value;
  }
  getAt(distance: number, name: string): T {
    return this.ancestor(distance).$values.get(name)!;
  }
  /**
   * Creates a new record in this environment
   * mapping the given name to given value.
   */
  define(name: string, value: T) {
    this.$values.set(name, value);
    return value;
  }
  /**
   * Assigns the given value to the given name.
   * A runtime error is thrown if no such name
   * exists.
   */
  assign(name: Token, value: T): T {
    if (this.$values.has(name.$lexeme)) {
      this.$values.set(name.$lexeme, value);
      return value;
    }
    if (this.$enclosing !== null) {
      return this.$enclosing.assign(name, value);
    }
    throw runtimeError(
      `Assigning to an undefined variable “${name.$lexeme}”`,
      `resolving an assignment`,
      name.$line,
      name.$column,
    );
  }
  /**
   * Returns the value bound to the given
   * name. A runtime error is thrown if
   * no such name exists.
   */
  get(name: Token): T {
    if (this.$values.has(name.$lexeme)) {
      return this.$values.get(name.$lexeme)!;
    }
    if (this.$enclosing !== null) {
      return this.$enclosing.get(name);
    }
    throw runtimeError(
      `Undefined variable name “${name.$lexeme}”`,
      `resolving a variable name`,
      name.$line,
      name.$column,
    );
  }
}

/**
 * Returns a new environment.
 */
const env = <T>(
  enclosing: Environment<T> | null,
) => (new Environment<T>(enclosing));

interface Resolvable<X = any> {
  resolve(expr: Expr, i: number): X;
}

enum FunctionType {
  NONE,
  FUNCTION,
  METHOD,
  INITIALIZER,
}

enum ClassType {
  NONE,
  CLASS,
}

class Resolver<T extends Resolvable = Resolvable> implements Visitor<void> {
  private $scopes: (Map<string, boolean>)[] = [];
  private scopesIsEmpty() {
    return this.$scopes.length === 0;
  }
  private $currentFunction: FunctionType = FunctionType.NONE;
  private $currentClass: ClassType = ClassType.NONE;
  private beginScope() {
    this.$scopes.push(new Map());
  }
  private endScope() {
    this.$scopes.pop();
  }
  private resolve(node: ASTNode) {
    node.accept(this);
  }
  private resolveEach(nodes: ASTNode[]) {
    for (let i = 0; i < nodes.length; i++) {
      this.resolve(nodes[i]);
    }
    return;
  }
  private $client: T;
  constructor(client: T) {
    this.$client = client;
  }
  private resolveLocal(node: Expr, name: string) {
    for (let i = this.$scopes.length - 1; i >= 0; i--) {
      const scope = this.$scopes[i];
      if (scope !== undefined && scope.has(name)) {
        this.$client.resolve(node, this.$scopes.length - 1 - i);
        return;
      }
    }
  }

  private peek(): Map<string, boolean> {
    return this.$scopes[this.$scopes.length - 1];
  }
  private declare(name: Token) {
    if (this.$scopes.length === 0) {
      return;
    }
    const scope = this.peek();
    if (scope.has(name.$lexeme)) {
      throw runtimeError(
        `Encountered a name collision. The variable “${name.$lexeme}” has already been declared in the current scope.`,
        `resolving a declaration`,
        name.$line,
        name.$column,
      );
    }
    scope.set(name.$lexeme, false);
  }
  private define(name: string) {
    if (this.$scopes.length === 0) {
      return;
    }
    const peek = this.peek();
    peek.set(name, true);
  }
  classStmt(stmt: ClassStmt): void {
    const enclosingClass = this.$currentClass;
    this.$currentClass = ClassType.CLASS;
    this.declare(stmt.$name);
    this.define(stmt.$name.$lexeme);
    this.beginScope();
    const peek = this.peek();
    peek.set("this", true);
    const methods = stmt.$methods;
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      let declaration = FunctionType.METHOD;
      if (method.$name.$lexeme === "def") {
        declaration = FunctionType.INITIALIZER;
      }
      this.resolveFn(method, declaration);
    }
    this.endScope();
    this.$currentClass = enclosingClass;
    return;
  }
  setExpr(expr: SetExpr): void {
    this.resolveEach(expr.$elements);
    return;
  }
  getExpr(expr: PropGetExpr): void {
    this.resolve(expr.$object);
    return;
  }
  propSetExpr(expr: PropSetExpr): void {
    this.resolve(expr.$value);
    this.resolve(expr.$object);
    return;
  }
  thisExpr(expr: ThisExpr): void {
    if (this.$currentClass === ClassType.NONE) {
      throw runtimeError(
        `Cannot use “this” outside of a class`,
        `resolving a this-expression`,
        expr.$keyword.$line,
        expr.$keyword.$column,
      );
    }
    this.resolveLocal(expr, expr.$keyword.$lexeme);
    return;
  }
  intExpr(expr: IntExpr): void {
    return;
  }
  floatExpr(expr: FloatExpr): void {
    return;
  }
  fracExpr(expr: FracExpr): void {
    return;
  }
  scinumExpr(expr: ScinumExpr): void {
    return;
  }
  numConstExpr(expr: NumericConstExpr): void {
    return;
  }
  nilExpr(expr: NilExpr): void {
    return;
  }
  stringExpr(expr: StringExpr): void {
    return;
  }
  booleanExpr(expr: BooleanExpr): void {
    return;
  }
  indexingExpr(expr: IndexingExpr): void {
    this.resolve(expr.$list);
    this.resolve(expr.$index);
    return;
  }
  tupleExpr(expr: TupleExpr): void {
    this.resolveEach(expr.$elements);
    return;
  }
  vectorExpr(expr: VectorExpr): void {
    this.resolveEach(expr.$elements);
    return;
  }
  matrixExpr(expr: MatrixExpr): void {
    this.resolveEach(expr.$vectors);
    return;
  }
  assignExpr(expr: AssignExpr): void {
    this.resolve(expr.$value);
    this.resolveLocal(expr, expr.$name.$name.$lexeme);
    return;
  }
  binaryExpr(expr: BinaryExpr): void {
    this.resolve(expr.$left);
    this.resolve(expr.$right);
    return;
  }
  logicalBinaryExpr(expr: LogicalBinaryExpr): void {
    this.resolve(expr.$left);
    this.resolve(expr.$right);
    return;
  }
  relationExpr(expr: RelationExpr): void {
    this.resolve(expr.$left);
    this.resolve(expr.$right);
    return;
  }
  callExpr(expr: CallExpr): void {
    this.resolve(expr.$callee);
    this.resolveEach(expr.$args);
    return;
  }
  groupExpr(expr: GroupExpr): void {
    this.resolve(expr.$inner);
    return;
  }
  unaryExpr(expr: UnaryExpr): void {
    this.resolve(expr.$arg);
    return;
  }
  variableExpr(expr: VariableExpr): void {
    const name = expr.$name;
    if (!this.scopesIsEmpty() && this.peek().get(name.$lexeme) === false) {
      throw runtimeError(
        `The user is attempting to read the variable “${expr.$name.$lexeme}” from its own initializer. This syntax has no semantic.`,
        `resolving a variable expression (identifier)`,
        expr.$name.$line,
        expr.$name.$column,
      );
    }
    this.resolveLocal(expr, expr.$name.$lexeme);
    return;
  }
  printStmt(stmt: PrintStmt): void {
    this.resolve(stmt.$expr);
    return;
  }
  varDefStmt(stmt: VarDefStmt): void {
    this.declare(stmt.$name);
    this.resolve(stmt.$value);
    this.define(stmt.$name.$lexeme);
    return;
  }
  whileStmt(stmt: WhileStmt): void {
    this.resolve(stmt.$condition);
    this.resolve(stmt.$body);
    return;
  }
  blockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolveEach(stmt.$statements);
    this.endScope();
    return;
  }
  returnStmt(stmt: ReturnStmt): void {
    if (this.$currentFunction === FunctionType.NONE) {
      throw runtimeError(
        `Encountered the “return” keyword at the top-level. This syntax has no semantic.`,
        `resolving a return statement`,
        stmt.$keyword.$line,
        stmt.$keyword.$column,
      );
    }
    if (this.$currentFunction === FunctionType.INITIALIZER) {
      throw runtimeError(
        `Can’t return a value from a class def`,
        `resolving a return statement`,
        stmt.$keyword.$line,
        stmt.$keyword.$column,
      );
    }
    this.resolve(stmt.$value);
    return;
  }
  expressionStmt(stmt: ExprStmt): void {
    this.resolve(stmt.$expression);
    return;
  }
  private resolveFn(node: FnDefStmt, type: FunctionType) {
    const enclosingFunction = this.$currentFunction;
    this.$currentFunction = type;
    this.beginScope();
    for (let i = 0; i < node.$params.length; i++) {
      this.declare(node.$params[i].$name);
      this.define(node.$params[i].$name.$lexeme);
    }
    this.resolveEach(node.$body);
    this.endScope();
    this.$currentFunction = enclosingFunction;
    return;
  }
  fnDefStmt(stmt: FnDefStmt): void {
    this.declare(stmt.$name);
    this.define(stmt.$name.$lexeme);
    this.resolveFn(stmt, FunctionType.FUNCTION);
    return;
  }
  conditionalStmt(stmt: ConditionalStmt): void {
    this.resolve(stmt.$condition);
    this.resolve(stmt.$then);
    this.resolve(stmt.$else);
    return;
  }
  resolved(statements: Statement[]) {
    try {
      for (let i = 0; i < statements.length; i++) {
        this.resolve(statements[i]);
      }
      return right(1);
    } catch (error) {
      return left(error as Err);
    }
  }
}

const resolvable = (client: Resolvable) => (
  new Resolver(client)
);

/**
 * A wrapper for a return value.
 */
class ReturnValue {
  $value: RuntimeValue;
  constructor(value: RuntimeValue) {
    this.$value = value;
  }
}

/**
 * Returns a new ReturnedValue.
 */
const returnValue = (value: RuntimeValue) => (
  new ReturnValue(value)
);

abstract class Callable {
  abstract call(interpreter: Interpreter, args: RuntimeValue[]): RuntimeValue;
}

/**
 * An object corresponding to a global function.
 */
class NativeFn extends Callable {
  $f: (...args: any[]) => RuntimeValue;
  constructor(f: (...args: RuntimeValue[]) => RuntimeValue) {
    super();
    this.$f = f;
  }
  call(interpreter: Interpreter, args: RuntimeValue[]): RuntimeValue {
    return this.$f(...args);
  }
}

/**
 * Returns a new native/global function.
 */
const nativeFn = (f: (...args: any[]) => RuntimeValue) => (
  new NativeFn(f)
);

/**
 * An object corresponding to a runtime
 * function.
 */
class Fn extends Callable {
  private $closure: Environment<RuntimeValue>;
  private $declaration: FnDefStmt;
  private $isInitializer: boolean;
  constructor(
    closure: Environment<RuntimeValue>,
    declaration: FnDefStmt,
    isInitializer: boolean,
  ) {
    super();
    this.$closure = closure;
    this.$declaration = declaration;
    this.$isInitializer = isInitializer;
  }
  bind(instance: KlassInstance) {
    const environment = env(this.$closure);
    environment.define("this", instance);
    return fn(environment, this.$declaration, this.$isInitializer);
  }
  call(interpreter: Interpreter, args: RuntimeValue[]) {
    const environment = env(this.$closure);
    for (let i = 0; i < this.$declaration.$params.length; i++) {
      environment.define(
        this.$declaration.$params[i].$name.$lexeme,
        args[i],
      );
    }
    try {
      const out = interpreter.executeBlock(
        this.$declaration.$body,
        environment,
      );
      if (this.$isInitializer) {
        return this.$closure.getAt(0, "this");
      }
      return out;
    } catch (error) {
      if (this.$isInitializer) {
        return this.$closure.getAt(0, "this");
      } else if (error instanceof ReturnValue) {
        return error.$value;
      } else {
        throw error;
      }
    }
  }
}
/**
 * Returns true, and asserts,
 * if the given `x` is an Fn object.
 */
const isCallable = (x: any): x is Fn => (
  x instanceof Callable
);

/**
 * Returns a new runtime function.
 */
const fn = (
  closure: Environment<RuntimeValue>,
  declaration: FnDefStmt,
  isInitializer: boolean,
) => (
  new Fn(closure, declaration, isInitializer)
);

/**
 * A runtime instance of a given Klass.
 */
class KlassInstance {
  $klass: Klass;
  $fields: Map<string, RuntimeValue> = new Map();
  constructor(klass: Klass) {
    this.$klass = klass;
  }
  set(name: Token, value: RuntimeValue) {
    this.$fields.set(name.$lexeme, value);
  }
  get(name: Token) {
    if (this.$fields.has(name.$lexeme)) {
      return this.$fields.get(name.$lexeme)!;
    }
    const method = this.$klass.findMethod(name.$lexeme);
    if (method !== null) {
      return method.bind(this);
    }
    throw runtimeError(
      `Undefined property ${name.$lexeme}`,
      `interpreting a property-get`,
      name.$line,
      name.$column,
    );
  }
  toString() {
    return this.$klass.$name + " instance";
  }
}

/**
 * A runtime Klass definition.
 */
class Klass extends Callable {
  $name: string;
  $methods: Map<string, Fn>;
  constructor(name: string, methods: Map<string, Fn>) {
    super();
    this.$name = name;
    this.$methods = methods;
  }
  findMethod(name: string) {
    if (this.$methods.has(name)) {
      return this.$methods.get(name)!;
    } else {
      return null;
    }
  }
  toString() {
    return name;
  }
  call(interpreter: Interpreter, args: RuntimeValue[]): RuntimeValue {
    const instance = new KlassInstance(this);
    const initializer = this.findMethod("def");
    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }
}

/**
 * Returns the assumed truth value
 * for the given value.
 */
const truthValue = (value: RuntimeValue) => {
  if (typeof value === "boolean") {
    return value;
  } else if (typeof value === "number") {
    return (
      value !== 0 &&
      !Number.isNaN(value)
    );
  } else if (typeof value === "string") {
    return value.length !== 0;
  } else if (value === null) {
    return false;
  }
  return true;
};

/**
 * An object corresponding to the interpreter’s
 * settings.
 */
type InterpreterSettings = {
  /**
   * A record of native functions.
   * Each key corresponds to the name of
   * a native function, which maps to a native
   * function (see {@link NativeFn}).
   *
   * Native functions are defined in the global
   * scope.
   */
  nativeFunctions: Record<string, NativeFn>;
  globalConstants: Record<string, RuntimeValue>;
};

/**
 * An object that executes a given syntax tree.
 */
class Interpreter implements Visitor<RuntimeValue> {
  $global: Environment<RuntimeValue>;
  $env: Environment<RuntimeValue>;
  $locals: Map<Expr, number>;
  resolve(expression: Expr, depth: number) {
    this.$locals.set(expression, depth);
  }
  constructor(settings: InterpreterSettings) {
    this.$global = env(null);
    // define the user’s native functions in the global environment
    for (const property in settings.nativeFunctions) {
      const functionName = property;
      const nativeFunction = settings.nativeFunctions[property];
      this.$global.define(functionName, nativeFunction);
    }
    // define the user’s global constants in the global environment
    for (const property in settings.globalConstants) {
      const constant = property;
      const value = settings.globalConstants[property];
      this.$global.define(constant, value);
    }
    this.$env = this.$global;
    this.$locals = new Map();
  }
  lookupVariable(name: Token, expr: Expr) {
    const distance = this.$locals.get(expr);
    if (distance !== undefined) {
      return this.$env.getAt(distance, name.$lexeme);
    } else {
      return this.$global.get(name);
    }
  }
  interpret(statements: Statement[]): Either<Err, RuntimeValue> {
    try {
      let result: RuntimeValue = null;
      const L = statements.length;
      for (let i = 0; i < L; i++) {
        result = this.evaluate(statements[i]);
      }
      return right(result);
    } catch (error) {
      return left(error as Err);
    }
  }

  evaluate(node: ASTNode): RuntimeValue {
    return node.accept(this);
  }

  intExpr(expr: IntExpr): RuntimeValue {
    return expr.$value;
  }
  floatExpr(expr: FloatExpr): RuntimeValue {
    return expr.$value;
  }
  fracExpr(expr: FracExpr): RuntimeValue {
    return expr.$value;
  }
  scinumExpr(expr: ScinumExpr): RuntimeValue {
    return expr.$value;
  }
  numConstExpr(expr: NumericConstExpr): RuntimeValue {
    return expr.$value;
  }
  nilExpr(expr: NilExpr): RuntimeValue {
    return expr.$value;
  }
  stringExpr(expr: StringExpr): RuntimeValue {
    return expr.$value;
  }
  booleanExpr(expr: BooleanExpr): RuntimeValue {
    return expr.$value;
  }
  indexingExpr(expr: IndexingExpr): RuntimeValue {
    const index = this.evaluate(expr.$index);
    if (!isJSInt(index)) {
      throw runtimeError(
        `Non-integer value passed as an index`,
        `interpreting an index expression`,
        expr.$leftBracket.$line,
        expr.$leftBracket.$column,
      );
    }
    const list = this.evaluate(expr.$list);
    const is_array = Array.isArray(list);
    const is_vector = isVector(list);
    const is_matrix = isMatrix(list);
    if (is_array || is_vector || is_matrix) {
      if (index > list.length) {
        throw runtimeError(
          `The index passed is out of bounds.`,
          `interpreting an index expression`,
          expr.$leftBracket.$line,
          expr.$leftBracket.$column,
        );
      } else if (index === 0) {
        throw runtimeError(
          `Invalid index passed. An index of 0 was passed, but indices always start at 1.`,
          `interpreting an index expression`,
          expr.$leftBracket.$line,
          expr.$leftBracket.$column,
        );
      }
    }
    if (is_array) {
      return list[index];
    } else if (is_vector) {
      return list.at(index);
    } else if (is_matrix) {
      return list.row(index);
    } else {
      throw runtimeError(
        `User indexed into a non-sequential value. Only sequences may be indexed into.`,
        `interpreting an index expression`,
        expr.$leftBracket.$line,
        expr.$leftBracket.$column,
      );
    }
  }
  setExpr(expr: SetExpr): RuntimeValue {
    const elements: RuntimeValue[] = [];
    for (let i = 0; i < expr.$elements.length; i++) {
      const elem = this.evaluate(expr.$elements[i]);
      elements.push(elem);
    }
    return set(elements);
  }
  getExpr(expr: PropGetExpr): RuntimeValue {
    const object = this.evaluate(expr.$object);
    if (object instanceof KlassInstance) {
      return object.get(expr.$name);
    }
    throw runtimeError(
      `Only instances have properties`,
      `interpreting a property-get-expression`,
      expr.$name.$line,
      expr.$name.$column,
    );
  }
  propSetExpr(expr: PropSetExpr): RuntimeValue {
    const object = this.evaluate(expr.$object);
    if (!(object instanceof KlassInstance)) {
      throw runtimeError(
        `Only instances have fields`,
        `interpreting a property-set-expression`,
        expr.$name.$line,
        expr.$name.$column,
      );
    }
    const value = this.evaluate(expr.$value);
    object.set(expr.$name, value);
    return value;
  }
  thisExpr(expr: ThisExpr): RuntimeValue {
    return this.lookupVariable(expr.$keyword, expr);
  }
  tupleExpr(expr: TupleExpr): RuntimeValue {
    const elements: RuntimeValue[] = [];
    for (let i = 0; i < expr.$elements.length; i++) {
      elements.push(this.evaluate(expr.$elements[i]));
    }
    return elements;
  }
  vectorExpr(expr: VectorExpr): RuntimeValue {
    const elements: number[] = [];
    for (let i = 0; i < expr.$elements.length; i++) {
      const elem = this.evaluate(expr.$elements[i]);
      if (typeof elem !== "number") {
        throw runtimeError(
          `Vectors may only have number elements`,
          `interpreting a vector expression`,
          expr.$leftBracket.$line,
          expr.$leftBracket.$column,
        );
      }
      elements.push(elem);
    }
    return vector(elements);
  }
  matrixExpr(expr: MatrixExpr): RuntimeValue {
    const vectors: Vector[] = [];
    for (let i = 0; i < expr.$vectors.length; i++) {
      const v = this.evaluate(expr.$vectors[i]);
      if (!isVector(v)) {
        throw runtimeError(
          `Matrices may only have vector elements`,
          `interpreting a matrix expression`,
          expr.$leftBracket.$line,
          expr.$leftBracket.$column,
        );
      }
      vectors.push(v);
    }
    return matrix(vectors);
  }
  assignExpr(expr: AssignExpr): RuntimeValue {
    const value = this.evaluate(expr.$value);
    const distance = this.$locals.get(expr);
    if (distance !== undefined) {
      this.$env.assignAt(distance, expr.$name.$name.$lexeme, value);
    } else {
      this.$global.assign(expr.$name.$name, value);
    }
    return value;
  }
  binaryExpr(expr: BinaryExpr): RuntimeValue {
    let left = this.evaluate(expr.$left);
    let right = this.evaluate(expr.$right);
    if (typeof left === "number" && typeof right === "number") {
      switch (expr.$op.$type) {
        case TokenType.PLUS:
          return left + right;
        case TokenType.MINUS:
          return left - right;
        case TokenType.STAR:
          return left * right;
        case TokenType.PERCENT:
          return percent(left, right);
        case TokenType.SLASH:
          return left / right;
        case TokenType.REM:
          return rem(left, right);
        case TokenType.MOD:
          return mod(left, right);
        case TokenType.CARET:
          return left ** right;
        case TokenType.DIV:
          return floor(left / right);
      }
    }
    throw runtimeError(
      `Unknown operator: ${expr.$op.$lexeme}`,
      `interpreting a unary expression`,
      expr.$op.$line,
      expr.$op.$column,
    );
  }
  logicalBinaryExpr(expr: LogicalBinaryExpr): RuntimeValue {
    let left = truthValue(this.evaluate(expr.$left));
    let right = truthValue(this.evaluate(expr.$right));
    switch (expr.$op.$type) {
      case TokenType.AND:
        return left && right;
      case TokenType.OR:
        return left || right;
      case TokenType.NAND:
        return !(left && right);
      case TokenType.NOR:
        return !(left || right);
      case TokenType.XNOR:
        return (left === right);
      case TokenType.XOR:
        return (left !== right);
    }
    throw runtimeError(
      `Unexpected operator: “${expr.$op.$lexeme}”`,
      `interpreting a logical binary experssion`,
      expr.$op.$line,
      expr.$op.$column,
    );
  }
  relationExpr(expr: RelationExpr): RuntimeValue {
    let left = this.evaluate(expr.$left);
    let right = this.evaluate(expr.$right);
    if (typeof left === "number" && typeof right === "number") {
      switch (expr.$op.$type) {
        case TokenType.EQUAL_EQUAL:
          return left === right;
        case TokenType.BANG_EQUAL:
          return left !== right;
        case TokenType.LESS:
          return left < right;
        case TokenType.GREATER:
          return left > right;
        case TokenType.LESS_EQUAL:
          return left <= right;
        case TokenType.GREATER_EQUAL:
          return left >= right;
      }
    }
    throw runtimeError(
      `Unknown operator: ${expr.$op.$lexeme}`,
      `interpreting a unary expression`,
      expr.$op.$line,
      expr.$op.$column,
    );
  }
  callExpr(expr: CallExpr): RuntimeValue {
    const callee = this.evaluate(expr.$callee);
    const args: RuntimeValue[] = [];
    for (let i = 0; i < expr.$args.length; i++) {
      args.push(this.evaluate(expr.$args[i]));
    }
    if (isCallable(callee)) {
      return callee.call(this, args);
    }
    throw runtimeError(
      `A value was called, but the value is not a function`,
      `evaluating a call expression`,
      expr.$paren.$line,
      expr.$paren.$column,
    );
  }
  groupExpr(expr: GroupExpr): RuntimeValue {
    return this.evaluate(expr.$inner);
  }
  unaryExpr(expr: UnaryExpr): RuntimeValue {
    const arg = this.evaluate(expr.$arg);
    if (expr.$op.is(TokenType.NOT)) {
      return !truthValue(arg);
    }
    if (expr.$op.is(TokenType.MINUS)) {
      if (!isJSNum(arg)) {
        throw runtimeError(
          `Invalid operand passed to “-”. Numeric negation is only defined on numbers.`,
          `interpreting a unary negation expression`,
          expr.$op.$line,
          expr.$op.$column,
        );
      }
      return -arg;
    }
    if (expr.$op.is(TokenType.BANG)) {
      if (isJSInt(arg)) {
        return factorialize(arg);
      } else {
        throw runtimeError(
          `Invalid operand passed to “!”. The factorial is only defined on integers`,
          `interpreting a factorial expression`,
          expr.$op.$line,
          expr.$op.$column,
        );
      }
    }
    throw runtimeError(
      `Unknown operator: ${expr.$op.$lexeme}`,
      `interpreting a unary expression`,
      expr.$op.$line,
      expr.$op.$column,
    );
  }
  variableExpr(expr: VariableExpr): RuntimeValue {
    return this.lookupVariable(expr.$name, expr);
  }
  printStmt(stmt: PrintStmt): RuntimeValue {
    const value = this.evaluate(stmt.$expr);
    print(value);
    return null;
  }
  varDefStmt(stmt: VarDefStmt): RuntimeValue {
    const value = this.evaluate(stmt.$value);
    this.$env.define(stmt.$name.$lexeme, value);
    return value;
  }
  whileStmt(stmt: WhileStmt): RuntimeValue {
    let out: RuntimeValue = null;
    while (truthValue(this.evaluate(stmt.$condition))) {
      out = this.evaluate(stmt.$body);
    }
    return out;
  }
  executeBlock(
    statements: Statement[],
    environment: Environment<RuntimeValue>,
  ) {
    const previous = this.$env;
    try {
      this.$env = environment;
      let result: RuntimeValue = null;
      const S = statements.length;
      for (let i = 0; i < S; i++) {
        result = this.evaluate(statements[i]);
      }
      return result;
    } finally {
      this.$env = previous;
    }
  }
  blockStmt(stmt: BlockStmt): RuntimeValue {
    const environment = env(this.$env);
    return this.executeBlock(stmt.$statements, environment);
  }
  returnStmt(stmt: ReturnStmt): RuntimeValue {
    const value = this.evaluate(stmt.$value);
    throw returnValue(value);
  }
  expressionStmt(stmt: ExprStmt): RuntimeValue {
    return this.evaluate(stmt.$expression);
  }
  fnDefStmt(stmt: FnDefStmt): RuntimeValue {
    const f = fn(this.$env, stmt, false);
    this.$env.define(stmt.$name.$lexeme, f);
    return f;
  }
  conditionalStmt(stmt: ConditionalStmt): RuntimeValue {
    if (truthValue(this.evaluate(stmt.$condition))) {
      return this.evaluate(stmt.$then);
    } else {
      return this.evaluate(stmt.$else);
    }
  }
  classStmt(stmt: ClassStmt): RuntimeValue {
    this.$env.define(stmt.$name.$lexeme, null);
    const methods = new Map<string, Fn>();
    for (let i = 0; i < stmt.$methods.length; i++) {
      const method = stmt.$methods[i];
      const f = fn(this.$env, method, method.$name.$lexeme === "def");
      methods.set(stmt.$methods[i].$name.$lexeme, f);
    }
    const klass = new Klass(stmt.$name.$lexeme, methods);
    this.$env.assign(stmt.$name, klass);
    return null;
  }
}

/**
 * Returns a Woven compiler.
 */
export const compiler = (settings: Partial<InterpreterSettings> = {}) => {
  const defaultSettings: InterpreterSettings = {
    globalConstants: {
      pi: PI,
      e: E,
    },
    nativeFunctions: {
      abs: nativeFn(abs),
      acos: nativeFn(acos),
      acosh: nativeFn(acosh),
      asin: nativeFn(asin),
      asinh: nativeFn(asinh),
      atan: nativeFn(atan),
      atan2: nativeFn(atan2),
      atanh: nativeFn(atanh),
      cbrt: nativeFn(cbrt),
      clz32: nativeFn(clz32),
      cos: nativeFn(cos),
      cosh: nativeFn(cosh),
      exp: nativeFn(EXP),
      expm1: nativeFn(expm1),
      floor: nativeFn(floor),
      fround: nativeFn(fround),
      hypot: nativeFn(hypot),
      imul: nativeFn(imul),
      ln: nativeFn(ln),
      log: nativeFn(log),
      ln1p: nativeFn(ln1p),
      lg: nativeFn(lg),
      max: nativeFn(max),
      min: nativeFn(min),
      rand: nativeFn(random),
      round: nativeFn(round),
      sgn: nativeFn(sgn),
      sin: nativeFn(sin),
      sinh: nativeFn(sinh),
      sqrt: nativeFn(sqrt),
      tan: nativeFn(tan),
      tanh: nativeFn(tanh),
      trunc: nativeFn(trunc),
    },
  };
  if (settings.globalConstants) {
    defaultSettings.globalConstants = {
      ...defaultSettings.globalConstants,
      ...settings.globalConstants,
    };
  }
  if (settings.nativeFunctions) {
    defaultSettings.nativeFunctions = {
      ...defaultSettings.nativeFunctions,
      ...settings.nativeFunctions,
    };
  }
  return {
    /**
     * Returns a stringified array of tokens.
     */
    tokens(code: string) {
      const result = lexicalAnalysis(code).stream();
      if (result.isLeft()) {
        return result.unwrap().print();
      } else {
        let outputText = "";
        const tokens = result.unwrap();
        tokens.forEach((token) => {
          outputText = outputText + token.toString() + "\n";
        });
        return outputText;
      }
    },
    /**
     * Returns a pretty-print tree of the AST.
     */
    ast(code: string) {
      const result = syntaxAnalysis(code).statements();
      if (result.isLeft()) {
        return result.unwrap().print();
      } else {
        const tree = result.unwrap();
        return treed(tree);
      }
    },
    /**
     * Executes the given code.
     */
    execute(code: string) {
      const ast = syntaxAnalysis(code).statements();
      if (ast.isLeft()) {
        const erm = ast.unwrap().print();
        print(erm);
        return erm;
      }
      const interpreter = new Interpreter(defaultSettings);
      const statements = ast.unwrap();
      const resolved = resolvable(interpreter).resolved(statements);
      if (resolved.isLeft()) {
        const erm = resolved.unwrap().print();
        print(erm);
        return erm;
      }
      const out = interpreter.interpret(statements);
      if (out.isLeft()) {
        const erm = out.unwrap().print();
        print(erm);
        return erm;
      }
      return out.unwrap();
    },
  };
};

type RelationOp = "<" | ">" | "=" | "!=" | "<=" | ">=";
type AlgebraicOp = "+" | "-" | "/" | "*" | "!" | "^";
type ExpressionType =
  | "symbol"
  | "integer"
  | "real"
  | "rational"
  | "dne"
  | RelationOp
  | `fn-${string}`
  | AlgebraicOp;

interface ExprVisitor<T> {
  int(expr: Int): T;
  rational(expr: Rational): T;
  sym(expr: Sym): T;
  dne(expr: DNE): T;
  real(expr: Real): T;
  relation(expr: Relation): T;
  sum(expr: Sum): T;
  product(expr: Product): T;
  power(expr: Power): T;
  difference(expr: Difference): T;
  quotient(expr: Quotient): T;
  factorial(expr: Factorial): T;
  algebraicFn(expr: AlgebraicFn): T;
}

/** An object corresponding to a mathematical expression. */
abstract class MathExpression {
  /** The parenthesis level of this expression. */
  $parenLevel: number = 0;
  parend() {
    this.$parenLevel++;
    return this;
  }
  /** Sets the parenthesis level of this expression to the provided level. */
  toParenLevel(level: number) {
    this.$parenLevel = level;
    return this;
  }
  /** Sets the parenthesis level of this expression to 0. */
  unParen() {
    this.$parenLevel = 0;
    return this;
  }
  /**
   * Returns true if this expression is an algebraic
   * expression, false otherwise.
   */
  abstract isAlgebraic(): this is AlgebraicExpression;
  abstract accept<T>(visitor: ExprVisitor<T>): T;
}

/** An object corresponding to an atomic expression. */
abstract class Atom extends MathExpression {}

type AlgebraicExpression =
  | Int
  | Sym
  | Sum
  | Power
  | Difference
  | Quotient
  | Factorial
  | AlgebraicFn;

/** An object corresponding to an integer. */
class Int extends Atom {
  $n: number;
  constructor(value: number) {
    super();
    this.$n = floor(value);
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.int(this);
  }
}

/** Returns a new integer. */
const int = (value: number) => (new Int(value));

/** An object corresponding to a rational number. */
class Rational extends Atom {
  $n: number;
  $d: number;
  constructor(n: number, d: number) {
    super();
    this.$n = floor(n);
    this.$d = floor(d);
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.rational(this);
  }
}

/** Returns a new rational. */
const rat = (numerator: number, denominator: number) => (
  new Rational(numerator, denominator)
);

/** An object corresponding to a symbol. */
class Sym extends Atom {
  $s: string;
  constructor(symbol: string) {
    super();
    this.$s = symbol;
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.sym(this);
  }
}

/** Returns a new symbol. */
const sym = (symbol: string) => (new Sym(symbol));
const isSym = (x: any): x is Sym => (
  x instanceof Sym
);

/**
 * An object corresponding to "Does Not Exist."
 * At runtime, this is equivalent to the JavaScript
 * "undefined".
 */
class DNE extends Atom {
  constructor() {
    super();
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.dne(this);
  }
}
const dne = () => (new DNE());

/** An object corresponding to a real number. */
class Real extends Atom {
  $n: number;
  constructor(value: number) {
    super();
    this.$n = value;
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.real(this);
  }
}

/** Returns a new real number. */
const real = (value: number) => (new Real(value));

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

/** An object corresponding to a relational expression. */
class Relation extends Compound {
  $args: [MathExpression, MathExpression];
  $op: RelationOp;
  constructor(op: RelationOp, left: MathExpression, right: MathExpression) {
    super(op, [left, right]);
    this.$args = [left, right];
    this.$op = op;
  }
  isAlgebraic(): this is AlgebraicExpression {
    return false;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.relation(this);
  }
}

/** Returns a new relational expression. */
const relation = (
  op: RelationOp,
  left: MathExpression,
  right: MathExpression,
) => (
  new Relation(op, left, right)
);

/**
 * An object corresponding to a sum.
 * Sums may have an arbitrary number of
 * arguments.
 */
class Sum extends Compound {
  $args: AlgebraicExpression[];
  $op: "+" = "+";
  constructor(args: AlgebraicExpression[]) {
    super("+", args);
    this.$args = args;
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.sum(this);
  }
}

/** Returns a new sum expression. */
const sum = (args: AlgebraicExpression[]) => (
  new Sum(args)
);

/** Returns true if the given object is a sum expression. */
const isSum = (obj: any): obj is Sum => (obj instanceof Sum);

/**
 * An object corresponding to a product.
 * Products may have an arbitrary number
 * of arguments.
 */
class Product extends Compound {
  $args: AlgebraicExpression[];
  $op: "*" = "*";
  constructor(args: AlgebraicExpression[]) {
    super("*", args);

    this.$args = args;
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.product(this);
  }
}

/** Returns a new product expression. */
const product = (args: AlgebraicExpression[]) => (new Product(args));

/** Returns true if the given object is a product. */
const isProduct = (obj: any): obj is Product => (obj instanceof Product);

/**
 * An object corresponding to a power expression.
 * The `^` operator is a binary infix operator.
 * That is, `^` always takes two, and only two,
 * arguments.
 */
class Power extends Compound {
  $args: [AlgebraicExpression, AlgebraicExpression];
  $op: "^" = "^";
  constructor(base: AlgebraicExpression, exponent: AlgebraicExpression) {
    super("^", [base, exponent]);
    this.$args = [base, exponent];
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.power(this);
  }
}

/** Returns a new power expression. */
const power = (
  base: AlgebraicExpression,
  exponent: AlgebraicExpression,
) => (new Power(base, exponent));

/** An object corresponding to a difference expression. */
class Difference extends Compound {
  $args: [AlgebraicExpression, AlgebraicExpression];
  $op: "-" = "-";
  constructor(left: AlgebraicExpression, right: AlgebraicExpression) {
    super("-", [left, right]);
    this.$args = [left, right];
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.difference(this);
  }
}

/** Returns the difference expression `left - right`. */
const diff = (left: AlgebraicExpression, right: AlgebraicExpression) => (
  new Difference(left, right)
);

/** Returns the negation of the given expression. */
const neg = (expression: AlgebraicExpression) => (
  product([int(-1), expression])
);

/** An object corresponding to a quotient. */
class Quotient extends Compound {
  $args: [AlgebraicExpression, AlgebraicExpression];
  $op: "/" = "/";
  constructor(a: AlgebraicExpression, b: AlgebraicExpression) {
    super("/", [a, b]);
    this.$args = [a, b];
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.quotient(this);
  }
}

/** Returns a new quotient expression. */
const quotient = (a: AlgebraicExpression, b: AlgebraicExpression) => (
  new Quotient(a, b)
);

/** An object corresponding to a factorial. */
class Factorial extends Compound {
  $args: [AlgebraicExpression];
  $op: "!" = "!";
  constructor(arg: AlgebraicExpression) {
    super("!", [arg]);
    this.$args = [arg];
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.factorial(this);
  }
}

/** Returns a new factorial expression. */
const factorial = (arg: AlgebraicExpression) => (new Factorial(arg));

/** A class corresponding to a function call. */
class AlgebraicFn extends Compound {
  $args: AlgebraicExpression[];
  constructor(functionName: string, args: AlgebraicExpression[]) {
    super(functionName, args);
    this.$args = args;
  }
  isAlgebraic(): this is AlgebraicExpression {
    return true;
  }
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.algebraicFn(this);
  }
}

/** Returns a new function call expression. */
const fun = (functionName: string, args: AlgebraicExpression[]) => (
  new AlgebraicFn(functionName, args)
);

/**
 * Given the provided `expression`,
 * returns the parsed algebraic syntax tree.
 */
function exp(expression: string) {
  const state = enstate(expression);

  /**
   * Parses a symbol.
   */
  const symbol: ParseRule<MathExpression> = (op) => {
    if (!op.isIdentifier()) {
      return state.error(
        `Expected symbol`,
        `parsing symbol`,
      );
    } else {
      return state.expr(sym(op.$lexeme));
    }
  };

  /**
   * Parses a floating point number.
   */
  const float: ParseRule<MathExpression> = (op) => {
    if (!op.isNumericToken()) {
      return state.error(
        `Expected integer`,
        `parsing integer`,
      );
    } else {
      return state.expr(real(op.$literal));
    }
  };

  /**
   * Parses an integer.
   */
  const integer: ParseRule<MathExpression> = (op) => {
    if (!op.isNumericToken()) {
      return state.error(
        `Expected integer`,
        `parsing integer`,
      );
    } else {
      return state.expr(int(op.$literal));
    }
  };

  /**
   * Parses a rational number.
   */
  const rational: ParseRule<MathExpression> = (op) => {
    if (!op.isFraction()) {
      return state.error(
        `Expected a rational`,
        `parsing a rational`,
      );
    } else {
      const literal = op.$literal;
      return state.expr(rat(literal.$n, literal.$d));
    }
  };

  /**
   * Parses a negation.
   */
  const negation: ParseRule<MathExpression> = (op) => {
    const p = precOf(op.$type);
    const e = expr(p);
    if (e.isLeft()) {
      return e;
    }
    const arg = e.unwrap();
    if (!arg.isAlgebraic()) {
      return state.error(
        `The unary '-' may only be used with algebraic expressions`,
        `parsing a negation`,
      );
    }
    return state.expr(neg(arg));
  };

  /**
   * Parses a difference expression.
   */
  const diffExpr: ParseRule<MathExpression> = (op, left) => {
    if (!left.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '-'`,
        "parsing a quotient",
      );
    }
    const rhs = expr(precOf(op.$type));
    if (rhs.isLeft()) {
      return rhs;
    }
    const right = rhs.unwrap();
    if (!right.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '-'`,
        "parsing a quotient",
      );
    }
    const out = diff(left, right);
    return state.expr(out);
  };

  /**
   * Parses a quotient expression.
   */
  const quotientExpr: ParseRule<MathExpression> = (op, left) => {
    if (!left.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '/'`,
        "parsing a quotient",
      );
    }
    const rhs = expr(precOf(op.$type));
    if (rhs.isLeft()) {
      return rhs;
    }
    const right = rhs.unwrap();
    if (!right.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '/'`,
        "parsing a quotient",
      );
    }
    const out = quotient(left, right);
    return state.expr(out);
  };

  /**
   * Parses a power expression.
   */
  const powerExpr: ParseRule<MathExpression> = (op, left) => {
    if (!left.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '^'`,
        `parsing a power`,
      );
    }
    const rhs = expr();
    if (rhs.isLeft()) {
      return rhs;
    }
    const right = rhs.unwrap();
    if (!right.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '^'`,
        `parsing a power`,
      );
    }
    const out = power(left, right);
    return state.expr(out);
  };

  /**
   * Parses a factorial expression.
   */
  const factorialExpr: ParseRule<MathExpression> = (op, arg) => {
    if (!arg.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '!'`,
        `parsing a factorial`,
      );
    }
    const out = factorial(arg);
    return state.expr(out);
  };

  /**
   * Parses a production expression.
   */
  const productExpr: ParseRule<MathExpression> = (op, left) => {
    const rhs = expr(precOf(op.$type));
    if (rhs.isLeft()) {
      return rhs;
    }
    const right = rhs.unwrap();
    if (!left.isAlgebraic() || !right.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '*'`,
        `parsing a product`,
      );
    }
    const args: AlgebraicExpression[] = [];
    if (isProduct(left)) {
      args.push(...left.$args);
    } else {
      args.push(left);
    }
    if (isProduct(right)) {
      args.push(...right.$args);
    } else {
      args.push(right);
    }
    const out = product(args);
    return state.expr(out);
  };

  /**
   * Parses a sum expression.
   */
  const sumExpr: ParseRule<MathExpression> = (op, left) => {
    const rhs = expr(precOf(op.$type));
    if (rhs.isLeft()) {
      return rhs;
    }
    const right = rhs.unwrap();
    if (!left.isAlgebraic() || !right.isAlgebraic()) {
      return state.error(
        `Only algebraic expressions may be used with '+'`,
        `parsing a sum`,
      );
    }
    const args: AlgebraicExpression[] = [];
    if (isSum(left)) {
      args.push(...left.$args);
    } else {
      args.push(left);
    }
    if (isSum(right)) {
      args.push(...right.$args);
    } else {
      args.push(right);
    }
    const out = sum(args);
    return state.expr(out);
  };

  /**
   * Parses a call expression.
   */
  const callExpr: ParseRule<MathExpression> = (op, lastNode) => {
    const callee = lastNode;
    if (!isSym(callee)) {
      return state.error(
        `Expected a symbol for a function name`,
        `parsing a call expression`,
      );
    }
    const args: AlgebraicExpression[] = [];
    if (!state.check(TokenType.RIGHT_PAREN)) {
      do {
        const e = expr();
        if (e.isLeft()) {
          return e;
        }
        const element = e.unwrap();
        if (!element.isAlgebraic()) {
          return state.error(
            `Only algebraic expressions may be passed to calls`,
            `parsing a call expression`,
          );
        }
        args.push(element);
      } while (state.nextIs(TokenType.COMMA));
    }

    if (!state.nextIs(TokenType.RIGHT_PAREN)) {
      return state.error(
        `Expected a “)” to close the arguments`,
        `parsing a function call`,
      );
    }
    const out = fun(callee.$s, args);
    return state.expr(out);
  };

  /** Parses a parenthesized expression. */
  const primary: ParseRule<MathExpression> = () => {
    const inner = expr();
    if (inner.isLeft()) {
      return inner;
    }
    if (!state.nextIs(TokenType.RIGHT_PAREN)) {
      return state.error(
        `Expected a closing “)”`,
        `parsing a parenthesized expression`,
      );
    }
    return state.expr(inner.unwrap().parend());
  };

  /**
   * Alias for BP.NONE, corresponding
   * to a binding power of nothing.
   * This is used purely as a placeholder
   * for the ParseRuleTable.
   */
  const ___o = BP.NONE;

  /**
   * A parse rule that always returns an
   * error. This is used purely as a
   * placeholder for empty slots in the
   * parse rules table.
   */
  const ___: ParseRule<MathExpression> = (t) => {
    if (state.$error !== null) {
      return left(state.$error);
    } else {
      return state.error(
        `Unrecognized lexeme in algebraic parser: ${t.$lexeme}`,
        `algebraic expression`,
      );
    }
  };
  const rules: ParseRuleTable<MathExpression> = {
    [TokenType.PLUS]: [___, sumExpr, BP.SUM],
    [TokenType.MINUS]: [negation, diffExpr, BP.DIFFERENCE],
    [TokenType.SLASH]: [___, quotientExpr, BP.QUOTIENT],
    [TokenType.STAR]: [___, productExpr, BP.PRODUCT],
    [TokenType.CARET]: [___, powerExpr, BP.POWER],
    [TokenType.LEFT_PAREN]: [primary, callExpr, BP.CALL],
    [TokenType.RIGHT_PAREN]: [___, ___, ___o],
    [TokenType.IDENTIFIER]: [symbol, ___, BP.LITERAL],
    [TokenType.INT]: [integer, ___, BP.LITERAL],
    [TokenType.FLOAT]: [float, ___, BP.LITERAL],
    [TokenType.FRACTION]: [rational, ___, BP.LITERAL],
    [TokenType.BANG]: [___, factorialExpr, BP.POSTFIX],

    [TokenType.LEFT_BRACE]: [___, ___, ___o],
    [TokenType.RIGHT_BRACE]: [___, ___, ___o],
    [TokenType.LEFT_BRACKET]: [___, ___, ___o],
    [TokenType.RIGHT_BRACKET]: [___, ___, ___o],
    [TokenType.COMMA]: [___, ___, ___o],
    [TokenType.DOT]: [___, ___, ___o],
    [TokenType.COLON]: [___, ___, ___o],
    [TokenType.SEMICOLON]: [___, ___, ___o],
    [TokenType.VBAR]: [___, ___, ___o],
    [TokenType.AMPERSAND]: [___, ___, ___o],
    [TokenType.TILDE]: [___, ___, ___o],

    [TokenType.MINUS_MINUS]: [___, ___, ___o],
    [TokenType.PLUS_PLUS]: [___, ___, ___o],
    [TokenType.PERCENT]: [___, ___, ___o],
    [TokenType.EQUAL]: [___, ___, ___o],
    [TokenType.EQUAL_EQUAL]: [___, ___, ___o],
    [TokenType.BANG_EQUAL]: [___, ___, ___o],
    [TokenType.LESS]: [___, ___, ___o],
    [TokenType.GREATER]: [___, ___, ___o],
    [TokenType.LESS_EQUAL]: [___, ___, ___o],
    [TokenType.GREATER_EQUAL]: [___, ___, ___o],
    [TokenType.AND]: [___, ___, ___o],
    [TokenType.OR]: [___, ___, ___o],
    [TokenType.NOT]: [___, ___, ___o],
    [TokenType.REM]: [___, ___, ___o],
    [TokenType.MOD]: [___, ___, ___o],
    [TokenType.DIV]: [___, ___, ___o],
    [TokenType.NOR]: [___, ___, ___o],
    [TokenType.XOR]: [___, ___, ___o],
    [TokenType.XNOR]: [___, ___, ___o],
    [TokenType.NAND]: [___, ___, ___o],

    [TokenType.SCIENTIFIC_NUMBER]: [___, ___, ___o],
    [TokenType.STRING]: [___, ___, ___o],
    [TokenType.CLASS]: [___, ___, ___o],
    [TokenType.IF]: [___, ___, ___o],
    [TokenType.ELSE]: [___, ___, ___o],
    [TokenType.TRUE]: [___, ___, ___o],
    [TokenType.FALSE]: [___, ___, ___o],
    [TokenType.FOR]: [___, ___, ___o],
    [TokenType.FN]: [___, ___, ___o],
    [TokenType.NIL]: [___, ___, ___o],
    [TokenType.PRINT]: [___, ___, ___o],
    [TokenType.RETURN]: [___, ___, ___o],
    [TokenType.SUPER]: [___, ___, ___o],
    [TokenType.THIS]: [___, ___, ___o],
    [TokenType.WHILE]: [___, ___, ___o],
    [TokenType.NUMERIC_CONSTANT]: [___, ___, ___o],
    [TokenType.LET]: [___, ___, ___o],
    [TokenType.VAR]: [___, ___, ___o],
    [TokenType.ERROR]: [___, ___, ___o],
    [TokenType.EMPTY]: [___, ___, ___o],
    [TokenType.END]: [___, ___, ___o],
  };
  /**
   * Returns the prefix rule associated
   * with the given token type.
   */
  const prefixRule = (type: TokenType): ParseRule<MathExpression> => (
    rules[type][0]
  );

  /**
   * Returns the infix rule associated
   * with the given token type.
   */
  const infixRule = (type: TokenType): ParseRule<MathExpression> => (
    rules[type][1]
  );

  /**
   * Returns the precedence of the given
   * token type.
   */
  const precOf = (type: TokenType): BP => (
    rules[type][2]
  );

  /**
   * Performs a Pratt parsing for an
   * expression.
   */
  const expr = (minBP: BP = BP.LOWEST) => {
    let token = state.next();
    const prefix = prefixRule(token.$type);
    let lhs = prefix(token, dne());
    if (lhs.isLeft()) {
      return lhs;
    }
    while (minBP < precOf(state.$peek.$type)) {
      if (state.atEnd()) {
        break;
      }
      token = state.next();
      const infix = infixRule(token.$type);
      const rhs = infix(token, lhs.unwrap());
      if (rhs.isLeft()) {
        return rhs;
      }
      lhs = rhs;
    }
    return lhs;
  };
  const run = () => {
    if (state.$error !== null) {
      return left(state.$error);
    } else {
      return expr();
    }
  };
  return run();
}

/**
 * A class implementing the `kind` function.
 */
class KIND implements ExprVisitor<ExpressionType> {
  int(expr: Int): ExpressionType {
    return "integer";
  }
  rational(expr: Rational): ExpressionType {
    return "rational";
  }
  sym(expr: Sym): ExpressionType {
    return "symbol";
  }
  dne(expr: DNE): ExpressionType {
    return "dne";
  }
  real(expr: Real): ExpressionType {
    return "real";
  }
  relation(expr: Relation): ExpressionType {
    return expr.$op;
  }
  sum(expr: Sum): ExpressionType {
    return expr.$op;
  }
  product(expr: Product): ExpressionType {
    return expr.$op;
  }
  power(expr: Power): ExpressionType {
    return expr.$op;
  }
  difference(expr: Difference): ExpressionType {
    return expr.$op;
  }
  quotient(expr: Quotient): ExpressionType {
    return expr.$op;
  }
  factorial(expr: Factorial): ExpressionType {
    return expr.$op;
  }
  algebraicFn(expr: AlgebraicFn): ExpressionType {
    return `fn-${expr.$op}`;
  }
}
const $KIND = new KIND();

/**
 * This function returns the given `expression`’s kind.
 */
const kind = (expression: MathExpression) => (
  expression.accept($KIND)
);

/**
 * A class implementing the `nops` function.
 */
class NOPS implements ExprVisitor<number> {
  int(expr: Int): number {
    return 0;
  }
  rational(expr: Rational): number {
    return 0;
  }
  sym(expr: Sym): number {
    return 0;
  }
  dne(expr: DNE): number {
    return 0;
  }
  real(expr: Real): number {
    return 0;
  }
  relation(expr: Relation): number {
    return expr.$args.length;
  }
  sum(expr: Sum): number {
    return expr.$args.length;
  }
  product(expr: Product): number {
    return expr.$args.length;
  }
  power(expr: Power): number {
    return expr.$args.length;
  }
  difference(expr: Difference): number {
    return expr.$args.length;
  }
  quotient(expr: Quotient): number {
    return expr.$args.length;
  }
  factorial(expr: Factorial): number {
    return expr.$args.length;
  }
  algebraicFn(expr: AlgebraicFn): number {
    return expr.$args.length;
  }
}
const $NOPS = new NOPS();

/**
 * Returns the number of operands of the given
 * `expression`. If the expression is not a compound
 * expression (i.e., an atom), the number of operands
 * is always `0`.
 */
const nops = (expression: MathExpression) => (
  expression.accept($NOPS)
);

class OPERAND_AT implements ExprVisitor<MathExpression> {
  $index: number;
  constructor(index: number) {
    this.$index = index - 1;
  }
  int(expr: Int): MathExpression {
    return dne();
  }
  rational(expr: Rational): MathExpression {
    return dne();
  }
  sym(expr: Sym): MathExpression {
    return dne();
  }
  dne(expr: DNE): MathExpression {
    return dne();
  }
  real(expr: Real): MathExpression {
    return dne();
  }
  private argAt(expr: Compound) {
    const out = expr.$args[this.$index];
    if (out === undefined) {
      return dne();
    } else {
      return out;
    }
  }
  relation(expr: Relation): MathExpression {
    return this.argAt(expr);
  }
  sum(expr: Sum): MathExpression {
    return this.argAt(expr);
  }
  product(expr: Product): MathExpression {
    return this.argAt(expr);
  }
  power(expr: Power): MathExpression {
    return this.argAt(expr);
  }
  difference(expr: Difference): MathExpression {
    return this.argAt(expr);
  }
  quotient(expr: Quotient): MathExpression {
    return this.argAt(expr);
  }
  factorial(expr: Factorial): MathExpression {
    return this.argAt(expr);
  }
  algebraicFn(expr: AlgebraicFn): MathExpression {
    return this.argAt(expr);
  }
}

/**
 * This function returns the `ith` operand of the given
 * `expression`. If the expression is not a compound expression
 * (i.e., an atom), the symbol `dne` is returned.
 */
const operand = (expression: MathExpression, ith: number) => (
  expression.accept(new OPERAND_AT(ith))
);

/**
 * This function simplifies a rational number. That is,
 * given a rational number `a/b`, returns `a/b`
 * in standard form (if an integer `n` is 
 * provided, returns `n`, since `n = n/1`, and `n/1`
 * is in standard form).
 */
const simplifyRationalNumber = (
  u: MathExpression,
) => {
  if (kind(u) === "integer") {
    return (u as Int);
  } else if (kind(u) === "rational") {
    let n = (u as Rational).$n;
    let d = (u as Rational).$d;
    if (mod(n, d) === 0) {
      return (int(iquot(n, d)));
    } else {
      let g = gcd(n, d);
      if (d > 0) {
        return (rat(iquot(n, g), iquot(d, g)));
      } else if (d < 0) {
        return (rat(iquot(-n, g), iquot(-d, g)));
      } else {
        return dne();
      }
    }
  } else {
    return dne();
  }
};

const j = exp(`12|8`);
const k = j.map((x) => simplifyRationalNumber(x));
print(treed(k));
