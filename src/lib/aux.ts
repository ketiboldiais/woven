// § Auxiliary Functions =======================================================
/**
 * At the parsing stage, all parsed node results
 * are kept in an `Either` type (either an AST node)
 * or an Err (error) object. We want to avoid
 * throwing as much as possible for optimal parsing.
 */
export type Either<A, B> = Left<A> | Right<B>;

/** A box type corresponding to failure. */
export class Left<T> {
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
export class Right<T> {
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
export const left = <T>(x: T): Left<T> => new Left(x);

/** Returns a new right. */
export const right = <T>(x: T): Right<T> => new Right(x);

/**
 * This function returns true if the given
 * `char` is a Latin or Greek character. This is used
 * in the scanner to quickly identify potential identifiers
 * or keywords.
 */
export const isLatinGreek = (
  char: string,
) => (/^[a-zA-Z_$\u00C0-\u02AF\u0370-\u03FF\u2100-\u214F]$/.test(char));

/**
 * This function returns true if the given
 * `char` is a math symbol.
 */
export const isMathSymbol = (char: string) => /^[∀-⋿]/u.test(char);

/**
 * This function returns true if the given `char` is
 * a digit (specifically, a Hindu-Arabic numeral).
 */
export const isDigit = (char: string) => "0" <= char && char <= "9";

export enum BP {
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
