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
  /** Operator token: `+` */
  PLUS,
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
 * What follows are global constants.
 */
const PI = Math.PI;
const E = Math.E;

/** Tokens have a literal value, but they must be a Primitive type. */
type Primitive = number | string | boolean | null;

/** A class corresponding to a token. */
class Token<T extends TOKEN, L extends Primitive = any> {
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

/** Returns the empty token (used as a placeholder for initializing states). */
const emptyToken = () => (
  token(TOKEN.EMPTY, "", null, -1, -1)
);

/** Returns true if the given character is a whitespace character. */
const isWhitespace = (c: string) => (
  c === " " ||
  c === "\n" ||
  c === "\t" ||
  c === "\r"
);

/** Returns true if the string `char` is a Latin or Greek character. */
const isLatinGreek = (
  char: string,
) => (/^[a-zA-Z_$\u00C0-\u02AF\u0370-\u03FF\u2100-\u214F]$/.test(char));

/** Returns true if the given string `char` is within the unicode range `∀-⋿`. Else, returns false. */
const isMathSymbol = (char: string) => /^[∀-⋿]/u.test(char);

/** Returns true if the given string `char` is a Latin/Greek character or a math symbol. Else, returns false. */
const isValidName = (
  char: string,
) => (isLatinGreek(char) || isMathSymbol(char));

/** Returns true if the given string `char` is a digit. Else, returns false. */
const isDigit = (char: string) => "0" <= char && char <= "9";

/** Returns true if the given character is a greek letter name. */
const isGreekLetterName = (c: string) => (
  /^(alpha|beta|gamma|delta|epsilon|zeta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|upsilon|phi|chi|psi|omega)/
    .test(c.toLowerCase())
);

/**
 * Returns true if the given character is
 * a hexadecimal digit, false otherwise.
 */
const isHexDigit = (char: string) => (
  (("0" <= char) && (char <= "9")) ||
  (("a" <= char) && (char <= "f")) ||
  (("A" <= char) && (char <= "F"))
);

/**
 * Returns true if the given character
 * is an octal digit, false otherwise.
 */
const isOctalDigit = (char: string) => (
  "0" <= char && char <= "7"
);

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
function lexicalAnalysis(code: string) {
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
   * Returns the code substring starting
   * from start to current.
   */
  const slice = () => code.slice($start, $current);

  /**
   * Returns a new token.
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
    while (!atEnd()) {
      const char = peek();
      switch (char) {
        case " ":
        case "\r":
        case "\t":
          tick();
          $column++;
          break;
        case "\n":
          $line++;
          $column = 0;
          tick();
          break;
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
   * Scans for a string
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

  const scanBinaryNumber = () => {
    // If the peek isn’t a 0 or a 1, then
    // we return an error. `0b` prefaces a binary
    // number, which must always be followed by
    // a 0 or a 1.
    if (!(peek() === "0" || peek() === ("1"))) {
      return errorToken(
        `Expected binary digits after “0b”`,
        `scanning a binary number`,
        `Either do not use a binary number, or follow “0b” with at least a 0 or a 1`,
      );
    }

    // As long as we keep seeing a 0 or a 1 and haven’t reached
    // the end,
    while (((peek() === "0") || (peek() === "1")) && !atEnd()) {
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

  /** Scans the provided code for a token. */
  const scan = () => {
    // We always start by skipping whitespace.
    skipWhitespace();

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
      scanWord();
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
      case "-":
        return newToken(TOKEN.MINUS);
      case "+":
        return newToken(TOKEN.PLUS);
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
  };
}
