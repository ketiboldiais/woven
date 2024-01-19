const { floor } = Math;
const MAX_INT = Number.MAX_SAFE_INTEGER;
const MAX_FLOAT = Number.MAX_VALUE;
/** At the parsing stage, all parsed node results are kept in an `Either` type (either an AST node) or an Err (error) object. We want to avoid throwing as much as possible for optimal parsing. */
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
 * A class corresponding to a fraction.
 */
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

/**
 * Returns a new fraction.
 * @param n - The fraction’s numerator.
 * @param d - The fraction’s denominator.
 */
const frac = (n: number, d: number) => (
  new Fraction(n, d)
);

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

enum TOKEN {
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
  /** Literal token: big integer */
  BIG_INT,
  /** Literal token: big fraction */
  BIG_FRACTION,
  /** Literal token: fraction */
  FRACTION,
  /** Literal token: complex number */
  COMPLEX,

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
  | TOKEN.INT
  | TOKEN.FLOAT
  | TOKEN.SCIENTIFIC_NUMBER
  | TOKEN.FRACTION
  | TOKEN.BIG_INT
  | TOKEN.BIG_FRACTION
  | TOKEN.COMPLEX;

/**
 * What follows are global constants.
 */
const PI = Math.PI;
const E = Math.E;

/** Tokens have a literal value, but they must be a Primitive type. */
type Primitive = number | string | boolean | null | Fraction | Scinum;

/** A class corresponding to a token. */
class Token<T extends TOKEN = any, L extends Primitive = any> {
  isRightDelimiter() {
    return (
      this.$type === TOKEN.RIGHT_PAREN ||
      this.$type === TOKEN.RIGHT_BRACKET ||
      this.$type === TOKEN.RIGHT_BRACE
    );
  }
  is(type: TOKEN) {
    return this.$type === type;
  }
  /** The token’s type. */
  $type: T;

  /** Returns a copy of this token with the provided token type. */
  type<K extends TOKEN>(tokenType: K) {
    const out = this.clone();
    out.$type = tokenType as any;
    return out as any as Token<K, L>;
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
    return out as any as Token<T, X>;
  }

  toString() {
    const typename = TOKEN[this.$type];
    return `[${typename} “${this.$lexeme}” L${this.$line} C${this.$column}]`;
  }

  constructor(
    type: T,
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

  static empty: Token<TOKEN, any> = new Token(TOKEN.EMPTY, "", null, -1, -1);
  isEmpty() {
    return this.$type === TOKEN.EMPTY;
  }
}

/**
 * Returns a new token.
 *
 * @param type
 * - The {@link TOKEN} type.
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
  type: TOKEN,
  lexeme: string,
  literal: T,
  line: number,
  column: number,
) => (
  new Token(type, lexeme, literal, line, column)
);

/** Returns true if the string `char` is a Latin or Greek character. */
const isLatinGreek = (
  char: string,
) => (/^[a-zA-Z_$\u00C0-\u02AF\u0370-\u03FF\u2100-\u214F]$/.test(char));

/** Returns true if the given string `char` is within the unicode range `∀-⋿`. Else, returns false. */
const isMathSymbol = (char: string) => /^[∀-⋿]/u.test(char);

/** Returns true if the given string `char` is a digit. Else, returns false. */
const isDigit = (char: string) => "0" <= char && char <= "9";

/**
 * Errors are classified by type.
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
type ErrorType =
  | "lexical-error"
  | "syntax-error"
  | "type-error"
  | "semantic-error"
  | "runtime-error";

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
   * A message corresponding to a possible
   * way to fix this error.
   */
  $fix: string;
  constructor(
    message: string,
    type: ErrorType,
    phase: string,
    line: number,
    column: number,
    fix: string,
  ) {
    super(message);
    this.$type = type;
    this.$phase = phase;
    this.$line = line;
    this.$column = column;
    this.$fix = fix;
  }
}

/**
 * Returns a error factory. This function
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
  fix: string,
) => (new Err(message, type, phase, line, column, fix));

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
    type: TOKEN,
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
  const errorToken = (message: string, phase: string, fix: string) => {
    const out = token(TOKEN.ERROR, "", null, $line, $column);
    $error = lexicalError(
      message,
      phase,
      $line,
      $column,
      fix,
    );
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
        return newToken(TOKEN.THIS);
      case "super":
        return newToken(TOKEN.SUPER);
      case "class":
        return newToken(TOKEN.CLASS);
      case "false":
        return newToken(TOKEN.FALSE).literal(false);
      case "true":
        return newToken(TOKEN.TRUE).literal(true);
      case "NAN":
        return newToken(TOKEN.NAN).literal(NaN);
      case "Inf":
        return newToken(TOKEN.INF).literal(Infinity);
      case "pi":
        return newToken(TOKEN.NUMERIC_CONSTANT).literal(PI);
      case "e":
        return newToken(TOKEN.NUMERIC_CONSTANT).literal(E);
      case "return":
        return newToken(TOKEN.RETURN);
      case "while":
        return newToken(TOKEN.WHILE);
      case "for":
        return newToken(TOKEN.FOR);
      case "let":
        return newToken(TOKEN.LET);
      case "var":
        return newToken(TOKEN.VAR);
      case "fn":
        return newToken(TOKEN.FN);
      case "if":
        return newToken(TOKEN.IF);
      case "else":
        return newToken(TOKEN.ELSE);
      case "print":
        return newToken(TOKEN.PRINT);
      case "rem":
        return newToken(TOKEN.REM);
      case "mod":
        return newToken(TOKEN.MOD);
      case "div":
        return newToken(TOKEN.DIV);
      case "nil":
        return newToken(TOKEN.NIL).literal(null);
      case "and":
        return newToken(TOKEN.AND);
      case "or":
        return newToken(TOKEN.OR);
      case "nor":
        return newToken(TOKEN.NOR);
      case "xor":
        return newToken(TOKEN.XOR);
      case "xnor":
        return newToken(TOKEN.XNOR);
      case "not":
        return newToken(TOKEN.NOT);
      case "nand":
        return newToken(TOKEN.NAND);
    }
    // If we make it to this line, then
    // the lexeme thus far is a user
    // symbol (e.g., a variable name,
    // a function name, etc.)
    return newToken(TOKEN.SYMBOL);
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
        `close the string with a double quote (")`,
      );
    }
    // Otherwise, there is a double-quote, so
    // we consume it.
    tick();

    // Now take the lexeme thus far.
    // This lexeme includes the double-quotes,
    // so we remove them with `slice(1,-1).`
    const lexeme = slice().slice(1, -1);

    return newToken(TOKEN.STRING, lexeme);
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
        `Either do not use a binary number, or follow “0b” with at least a 0 or a 1`,
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

    return newToken(TOKEN.INT).literal(numericValue);
  };

  const newNumberToken = (
    numberString: string,
    type: NumberTokenType,
    hasSeparators: boolean,
  ) => {
    const n = hasSeparators ? numberString.replaceAll("_", "") : numberString;
    switch (type) {
      case TOKEN.INT: {
        const num = Number.parseInt(n);
        if (num > MAX_INT) {
          return errorToken(
            `encountered an integer overflow.`,
            `scanning an integer literal`,
            `considering using a big integer.`,
          );
        } else {
          return newToken(type).literal(num);
        }
      }
      case TOKEN.FLOAT: {
        const num = Number.parseFloat(n);
        if (num > MAX_FLOAT) {
          return errorToken(
            `encountered a floating point overflow.`,
            `scanning a floating point number`,
            `consider using a fraction or big fraction`,
          );
        } else {
          return newToken(type).literal(num);
        }
      }
      case TOKEN.SCIENTIFIC_NUMBER: {
        const [a, b] = n.split("E");
        const base = Number.parseFloat(a);
        const exponent = Number.parseInt(b);
        return newToken(type).literal(scinum(base, exponent));
      }
      case TOKEN.FRACTION: {
        const [N, D] = n.split("|");
        const numerator = Number.parseInt(N);
        const denominator = Number.parseInt(D);
        if (numerator > MAX_INT) {
          return errorToken(
            `encounterd an integer overflow in the numerator of “${n}”`,
            `scanning a fraction`,
            `considering using a big fraction`,
          );
        } else if (denominator > MAX_INT) {
          return errorToken(
            `encounterd an integer overflow in the denominator of “${n}”`,
            `scanning a fraction`,
            `considering using a big fraction`,
          );
        } else {
          return newToken(type).literal(frac(numerator, denominator));
        }
      }
      default:
        return errorToken(
          `unknown number type`,
          `scanning a number`,
          `refrain from using “${n}”`,
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
              // a possible fix
              `Use exactly three digits after “_”, or refrain from using an underscore-separated number.`,
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
          // a possible fix
          `Use exactly three digits after “_”, or refrain from using an underscore-separated number.`,
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
      type = TOKEN.FLOAT;
      // Continue consuming digits.
      while (isDigit(peek()) && !atEnd()) {
        tick();
      }
    }

    // The digit could be followed by a vertical bar.
    // If it is, then this is a fraction.
    if (peekIs("|")) {
      if (type !== TOKEN.INT) {
        return errorToken(
          `Expected an integer before “|”`,
          `scanning a fraction`,
          `Before the “|”, place an integer, or refrain from using a fraction (e.g., use a float instead)`,
        );
      }
      type = TOKEN.FRACTION;
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
        type = TOKEN.SCIENTIFIC_NUMBER;
        tick();
        while (isDigit(peek())) {
          tick();
        }
      } else if (
        ((peekNext() === "+") || (peekNext() === "-")) && isDigit(lookup(2))
      ) {
        type = TOKEN.SCIENTIFIC_NUMBER;
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
      return newToken(TOKEN.END, "END");
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
        return scanNumber(TOKEN.INT);
      }
    }

    // We check if this is a delimiter.
    switch (char) {
      case ":":
        return newToken(TOKEN.COLON);
      case "&":
        return newToken(TOKEN.AMPERSAND);
      case "~":
        return newToken(TOKEN.TILDE);
      case "|":
        return newToken(TOKEN.VBAR);
      case "(":
        return newToken(TOKEN.LEFT_PAREN);
      case ")":
        return newToken(TOKEN.RIGHT_PAREN);
      case "[":
        return newToken(TOKEN.LEFT_BRACKET);
      case "]":
        return newToken(TOKEN.RIGHT_BRACKET);
      case "{":
        return newToken(TOKEN.LEFT_BRACE);
      case "}":
        return newToken(TOKEN.RIGHT_BRACE);
      case ",":
        return newToken(TOKEN.COMMA);
      case ".":
        return newToken(TOKEN.DOT);
      case "-": {
        if (peek() === "-" && peekNext() === "-") {
          while (peek() !== "\n" && !atEnd()) {
            tick();
          }
          return Token.empty;
        } else {
          return newToken(match("-") ? TOKEN.MINUS_MINUS : TOKEN.MINUS);
        }
      }
      case "+":
        return newToken(match("+") ? TOKEN.PLUS_PLUS : TOKEN.PLUS);
      case "*":
        return newToken(TOKEN.STAR);
      case ";":
        return newToken(TOKEN.SEMICOLON);
      case "%":
        return newToken(TOKEN.PERCENT);
      case "/":
        return newToken(TOKEN.SLASH);
      case "^":
        return newToken(TOKEN.CARET);
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
              `close the block comment with three equal symbols ("===")`,
            );
          }
          while (peek() === "=") {
            tick();
          }
          return Token.empty;
        } else {
          return newToken(match("=") ? TOKEN.EQUAL_EQUAL : TOKEN.EQUAL);
        }
      }
      // If the next character is `=`, then we
      // match the lexeme `!=`. Otherwise, we only
      // match the lexeme `!`.
      case "!":
        return newToken(match("=") ? TOKEN.BANG_EQUAL : TOKEN.BANG);

      // If the next character is `=`, then we match
      // the lexeme `<=`. Otherwise, we only
      // match the lexeme `<`.
      case "<":
        return newToken(match("=") ? TOKEN.LESS_EQUAL : TOKEN.LESS);

      // If the next character is `=`, then we match
      // the lexeme `>=`. Otherwise, we only
      // match the lexeme `>`.
      case ">":
        return newToken(match("=") ? TOKEN.GREATER_EQUAL : TOKEN.GREATER);

      // special handling for strings
      case `"`:
        return scanString();
    }
    return errorToken(
      `unknown token: “${char}”`,
      `scanning for tokens`,
      `remove the unknown token`,
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
        prev.isRightDelimiter() && now.is(TOKEN.COMMA) &&
        peek.isRightDelimiter()
      ) {
        continue;
      }
      out.push(now);
    }
    out.push(peek);
    if (out.length && !out[out.length - 1].is(TOKEN.END)) {
      out.push(token(
        TOKEN.END,
        "END",
        null,
        $line,
        $column,
      ));
    }
    return right(out);
  };

  return {
    stream,
    scan,
  };
}

interface ExprVisitor<T> {
  int(expr: Int): T;
  float(expr: Float): T;
  assign(expr: Assign): T;
  binaryExpr(expr: BinaryExpr): T;
  callExpr(expr: CallExpr): T;
  groupExpr(expr: GroupExpr): T;
  logicalBinaryExpr(expr: LogicalBinaryExpr): T;
  unaryExpr(expr: UnaryExpr): T;
  variable(expr: Variable): T;
}

abstract class Expr {
  abstract accept<T>(ExprVisitor: ExprVisitor<T>): T;
}

/** A class corresponding to an integer node. */
class Int extends Expr {
  $value: number;
  constructor(value: number) {
    super();
    this.$value = floor(value);
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.int(this);
  }
}

/**
 * Returns a new integer node.
 */
const int = (value: number) => (
  new Int(value)
);

/** A class corresponding to a float node. */
class Float extends Expr {
  $value: number;
  constructor(value: number) {
    super();
    this.$value = value;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.float(this);
  }
}

/**
 * Returns a new float node.
 */
const float = (value: number) => (
  new Float(value)
);

/** A class corresponding to an Assignment node. */
class Assign extends Expr {
  $name: Token;
  $value: Expr;
  constructor(name: Token, value: Expr) {
    super();
    this.$name = name;
    this.$value = value;
  }
  accept<T>(ExprVisitor: ExprVisitor<T>): T {
    return ExprVisitor.assign(this);
  }
}

/**
 * Returns a new assignment node.
 */
const assign = (name: Token, value: Expr) => (
  new Assign(name, value)
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
}
const variable = (name: Token) => (
  new Variable(name)
);

interface StmtVisitor<T> {
  block(stmt: BlockStmt): T;
  expression(stmt: ExprStmt): T;
  fnDef(stmt: FnDefStmt): T;
  conditional(stmt: ConditionalStmt): T;
}

abstract class Stmt {
  abstract accept<T>(visitor: StmtVisitor<T>): T;
}

/**
 * A class corresponding to a block statement.
 */
class BlockStmt extends Stmt {
  $statements: Stmt[];
  constructor(statements: Stmt[]) {
    super();
    this.$statements = statements;
  }
  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.block(this);
  }
}

/**
 * Returns a new block statement node.
 */
const blockStmt = (statements: Stmt[]) => (
  new BlockStmt(statements)
);

/**
 * A class corresponding to an expression statement.
 */
class ExprStmt extends Stmt {
  $expression: Expr;
  constructor(expression: Expr) {
    super();
    this.$expression = expression;
  }
  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.expression(this);
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
class FnDefStmt extends Stmt {
  $name: Token;
  $params: Token[];
  $body: Stmt[];
  constructor(name: Token, params: Token[], body: Stmt[]) {
    super();
    this.$name = name;
    this.$params = params;
    this.$body = body;
  }
  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.fnDef(this);
  }
}

/**
 * Returns a new function definition statement
 * node.
 */
const fnDefStmt = (name: Token, params: Token[], body: Stmt[]) => (
  new FnDefStmt(name, params, body)
);

class ConditionalStmt extends Stmt {
  $condition: Expr;
  $then: Stmt;
  $else: Stmt;
  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt) {
    super();
    this.$condition = condition;
    this.$then = thenBranch;
    this.$else = elseBranch;
  }
  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.conditional(this);
  }
}

/**
 * Returns a new conditional statement node.
 */
const conditionalStmt = (
  condition: Expr,
  thenBranch: Stmt,
  elseBranch: Stmt,
) => (
  new ConditionalStmt(condition, thenBranch, elseBranch)
);
