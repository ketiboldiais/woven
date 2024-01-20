const print = console.log;
const { floor } = Math;
const MAX_INT = Number.MAX_SAFE_INTEGER;
const MAX_FLOAT = Number.MAX_VALUE;

// § Tree Printer
/**
 * In later sections, it will be useful to print
 * a pretty form of a given object tree.
 * We define that function here.
 */

/**
 * Returns a pretty-pritn string of the
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

/**
 * § Runtime Values
 *
 * What follows are runtime values that will be associated
 * with particular nodes.
 */

/** A class corresponding to a fraction.  */
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

// § Runtime Value: Fraction

/**
 * Returns a new fraction.
 * @param n - The fraction’s numerator.
 * @param d - The fraction’s denominator.
 */
const frac = (n: number, d: number) => (
  new Fraction(n, d)
);

// § Runtime Value: Scientific Number

/**
 * A class corresponding to a scientific number.
 */
class Scinum {
  $b: number;
  $e: number;
  constructor(b: number, e: number) {
    this.$b = b;
    this.$e = e;
  }
}
const scinum = (base: number, exponent: number) => (
  new Scinum(base, exponent)
);

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
  SYMBOL,
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
  LET,
  WHILE,
  NAN,
  INF,
  NUMERIC_CONSTANT,
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
type Primitive = number | string | boolean | null | Fraction | Scinum | Err;

/** A class corresponding to a token. */
class Token<L extends Primitive = any> {
  isRightDelimiter() {
    return (
      this.$type === TokenType.RIGHT_PAREN ||
      this.$type === TokenType.RIGHT_BRACKET ||
      this.$type === TokenType.RIGHT_BRACE
    );
  }
  is(type: TokenType) {
    return this.$type === type;
  }
  /** The token’s type. */
  $type: TokenType;

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

  toString() {
    const typename = TokenType[this.$type];
    return `[${typename} “${this.$lexeme}” L${this.$line} C${this.$column}]`;
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

  /**
   * Returns true, and asserts,
   * that this token is an integer token.
   */
  isNumericToken(): this is Token<number> {
    return (this.$type === TokenType.INT) || (
      this.$type === TokenType.FLOAT
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

  static empty: Token<any> = new Token(TokenType.EMPTY, "", null, -1, -1);
  static END() {
    return new Token(TokenType.END, "END", null, -1, -1);
  }
  isEmpty() {
    return this.$type === TokenType.EMPTY;
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
const token = <T extends Primitive>(
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

  constructor(
    message: string,
    type: ErrorType,
    phase: string,
    line: number,
    column: number,
  ) {
    super(message);
    this.$type = type;
    this.$phase = phase;
    this.$line = line;
    this.$column = column;
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
    while ((isLatinGreek(peek()) || isMathSymbol(peek())) && (!atEnd())) {
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
        return newToken(TokenType.NAN).literal(NaN);
      case "Inf":
        return newToken(TokenType.INF).literal(Infinity);
      case "pi":
        return newToken(TokenType.NUMERIC_CONSTANT).literal(PI);
      case "e":
        return newToken(TokenType.NUMERIC_CONSTANT).literal(E);
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
    return newToken(TokenType.SYMBOL);
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
    const lexeme = slice().slice(1, -1);

    return newToken(TokenType.STRING, lexeme);
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

/**
 * A type corresponding to a node’s
 * kind.
 */
enum NodeKind {
  int,
  float,
  nil,
  assignExpr,
  binaryExpr,
  callExpr,
  groupExpr,
  logicalBinaryExpr,
  unaryExpr,
  variableExpr,
  blockStmt,
  exprStmt,
  fnDefStmt,
  condStmt,
}

interface ExprVisitor<T> {
  intExpr(expr: IntExpr): T;
  floatExpr(expr: FloatExpr): T;
  nilExpr(expr: NilExpr): T;
  assignExpr(expr: AssignExpr): T;
  binaryExpr(expr: BinaryExpr): T;
  callExpr(expr: CallExpr): T;
  groupExpr(expr: GroupExpr): T;
  logicalBinaryExpr(expr: LogicalBinaryExpr): T;
  unaryExpr(expr: UnaryExpr): T;
  variable(expr: Variable): T;
}

abstract class ASTNode {
  abstract kind(): NodeKind;
}

abstract class Expr extends ASTNode {
  abstract accept<T>(ExprVisitor: ExprVisitor<T>): T;
}


/**
 * A class corresponding to a nil literal expression.
 */
class NilExpr extends Expr {
  $value: null = null;
  constructor() {
    super();
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.nilExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.nil;
  }
}
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
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.intExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.int;
  }
}

/**
 * A class corresponding to an float literal expression.
 */
class FloatExpr extends Expr {
  $value: number;
  constructor(value: number) {
    super();
    this.$value = value;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.floatExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.float;
  }
}
const float = (value:number) => (
  new FloatExpr(value)
)

/**
 * Returns a new literal node.
 */
const int = (value: number) => (
  new IntExpr(value)
);

/** A class corresponding to an Assignment node. */
class AssignExpr extends Expr {
  $name: Token;
  $value: Expr;
  constructor(name: Token, value: Expr) {
    super();
    this.$name = name;
    this.$value = value;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.assignExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.assignExpr;
  }
}

/**
 * Returns a new assignment node.
 */
const assign = (name: Token, value: Expr) => (
  new AssignExpr(name, value)
);

/** A class corresponding to a binary expression. */
class BinaryExpr extends Expr {
  $left: Expr;
  $op: Token;
  $right: Expr;
  constructor(left: Expr, op: Token, right: Expr) {
    super();
    this.$left = left;
    this.$op = op;
    this.$right = right;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.binaryExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.binaryExpr;
  }
}

/**
 * A class corresponding to a logical binary expression.
 */
class LogicalBinaryExpr extends Expr {
  $left: Expr;
  $op: Token;
  $right: Expr;
  constructor(left: Expr, op: Token, right: Expr) {
    super();
    this.$left = left;
    this.$op = op;
    this.$right = right;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.logicalBinaryExpr(this);
  }
  kind(): NodeKind {
    return NodeKind.logicalBinaryExpr;
  }
}

/**
 * A class corresponding to a unary expression.
 */
class UnaryExpr extends Expr {
  $op: Token;
  $arg: Expr;
  constructor(op: Token, arg: Expr) {
    super();
    this.$op = op;
    this.$arg = arg;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.unaryExpr(this);
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
 * Returns a new logical binary expression node.
 */
const logicalBinaryExpr = (left: Expr, op: Token, right: Expr) => (
  new LogicalBinaryExpr(left, op, right)
);

/**
 * Returns a new binary expression node.
 */
const binex = (left: Expr, op: Token, right: Expr) => (
  new BinaryExpr(left, op, right)
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
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.callExpr(this);
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
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.groupExpr(this);
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
class Variable extends Expr {
  $name: Token;
  constructor(name: Token) {
    super();
    this.$name = name;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.variable(this);
  }
  kind(): NodeKind {
    return NodeKind.variableExpr;
  }
}
const variable = (name: Token) => (
  new Variable(name)
);

interface StatementVisitor<T> {
  block(stmt: BlockStmt): T;
  expression(stmt: ExprStmt): T;
  fnDef(stmt: FnDefStmt): T;
  conditional(stmt: ConditionalStmt): T;
}

abstract class Statement extends ASTNode {
  abstract accept<T>(visitor: StatementVisitor<T>): T;
}

/**
 * A class corresponding to a block statement.
 */
class BlockStmt extends Statement {
  $statements: Statement[];
  constructor(statements: Statement[]) {
    super();
    this.$statements = statements;
  }
  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.block(this);
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
 * A class corresponding to an expression statement.
 */
class ExprStmt extends Statement {
  $expression: Expr;
  constructor(expression: Expr) {
    super();
    this.$expression = expression;
  }
  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.expression(this);
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
  $params: Token[];
  $body: Statement[];
  constructor(name: Token, params: Token[], body: Statement[]) {
    super();
    this.$name = name;
    this.$params = params;
    this.$body = body;
  }
  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.fnDef(this);
  }
  kind(): NodeKind {
    return NodeKind.fnDefStmt;
  }
}

/**
 * Returns a new function definition statement
 * node.
 */
const fnDefStmt = (name: Token, params: Token[], body: Statement[]) => (
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
  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.conditional(this);
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

enum BP {
  NONE,
  LOWEST,
  STRINGOP,
  ASSIGN,
  ATOM,
  OR,
  NOR,
  AND,
  NAND,
  XOR,
  XNOR,
  NOT,
  EQ,
  REL,
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
   * Returns true if the current token
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
      this.$lexer.isDone() ||
      this.$error !== null
    );
  }
  constructor(code: string) {
    this.$lexer = lexicalAnalysis(code);
    this.next();
  }
  /**
   * Returns a new Right<Statement>
   */
  statement(stmt: Statement) {
    return right(stmt);
  }
  /**
   * Returns a new Right<Expr>
   */
  expr(expr: Expr) {
    return right(expr);
  }
}
const enstate = (code: string) => (
  new ParserState(code)
);

function syntaxAnalysis(code: string) {
  const state = enstate(code);

  /**
   * A parse rule that parses an integer.
   */
  const number: ParseRule<Expr> = (t) => {
    if (t.isNumericToken()) {
      if (t.is(TokenType.FLOAT)) {
        return state.expr(float(t.$literal));
      } else {
        return state.expr(int(t.$literal));
      }
    } else {
      return state.error(
        `Expected an integer, but got ${t.$lexeme}`,
        `parsing an integer`,
      );
    }
  };

  const infix: ParseRule<Expr> = (op, lhs) => {
    const p = precOf(op.$type);
    const rhs = expr(p);
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
    [TokenType.LEFT_PAREN]: [___, ___, ___o],
    [TokenType.RIGHT_PAREN]: [___, ___, ___o],
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
    [TokenType.SLASH]: [___, ___, ___o],
    [TokenType.CARET]: [___, ___, ___o],
    [TokenType.MINUS]: [___, ___, ___o],
    [TokenType.MINUS_MINUS]: [___, ___, ___o],
    [TokenType.PLUS]: [___, infix, BP.SUM],
    [TokenType.PLUS_PLUS]: [___, ___, ___o],
    [TokenType.STAR]: [___, ___, ___o],
    [TokenType.PERCENT]: [___, ___, ___o],
    [TokenType.BANG]: [___, ___, ___o],
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
    [TokenType.SYMBOL]: [___, ___, ___o],
    [TokenType.INT]: [number, ___, BP.ATOM],
    [TokenType.FLOAT]: [number, ___, BP.ATOM],
    [TokenType.SCIENTIFIC_NUMBER]: [___, ___, ___o],
    [TokenType.FRACTION]: [___, ___, ___o],
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
    [TokenType.LET]: [___, ___, ___o],
    [TokenType.WHILE]: [___, ___, ___o],
    [TokenType.NAN]: [___, ___, ___o],
    [TokenType.INF]: [___, ___, ___o],
    [TokenType.NUMERIC_CONSTANT]: [___, ___, ___o],
    [TokenType.VAR]: [___, ___, ___o],
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
  const expression = () => {
    const out = expr();
    if (out.isLeft()) {
      return out;
    }
    const expression = out.unwrap();
    if (state.nextIs(TokenType.SEMICOLON)) {
      return state.statement(exprStmt(expression));
    }
    return state.error(
      `Expected a “;” to end the statement`,
      `expression statement`,
    );
  };
  const statement = () => {
    return expression();
  };
  return {
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

const test = syntaxAnalysis(
  `1 + 2;`,
);
const out = test.statements();
print(treed(out));
