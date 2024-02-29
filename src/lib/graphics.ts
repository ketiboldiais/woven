import { compiler, isCallable } from "./main";
import { clamp, range, v3D, Vector3D } from "./math.numerics";

// § Mixin Function ============================================================
type Constructor<T = {}> = new (...args: any[]) => T;
type MixOf<A, B> = A & Constructor<B>;

// § Graphics Module ===========================================================
// This section implements Woven’s graphics modules.

type PAR =
  | "xMinYMin"
  | "xMidYMin"
  | "xMaxYMin"
  | "xMinYMid"
  | "xMidYMid"
  | "xMaxYMid"
  | "xMinYMax"
  | "xMidYMax"
  | "xMaxYMax";

class CoordinateSystem {
  $xDomain: [number, number];
  $yDomain: [number, number];
  $zDomain: [number, number];
  constructor(
    xDomain: [number, number],
    yDomain: [number, number],
    zDomain: [number, number],
  ) {
    this.$xDomain = xDomain;
    this.$yDomain = yDomain;
    this.$zDomain = zDomain;
  }
}

/**
 * Returns a new coordinate system object.
 */
export const coord = (
  xDomain: [number, number],
  yDomain: [number, number],
  zDomain: [number, number] = [-10, 10],
) => (new CoordinateSystem(xDomain, yDomain, zDomain));

/**
 * An object corresponding to an SVG element.
 */
class SVG {
  /** The width of this SVG, in pixels. */
  $width: number;

  /** The height of this SVG, in pixels. */
  $height: number;

  /** This SVG’s viewbox. */
  $viewBox: string;

  /** This SVG’s preserveAspectRatio property.  */
  $preserveAspectRatio: `${PAR} ${"meet" | "slice"}`;

  /** An array of child elements for this SVG. */
  $children: Renderable[] = [];

  /** Appends the provided children to this SVG. */
  children(renderables: Renderable[]) {
    renderables.forEach((c) => this.$children.push(c));
    return this;
  }

  /** Appends the given child to this SVG. */
  child(renderable: Renderable) {
    this.$children.push(renderable);
    return this;
  }

  /**
   * Returns an array whose elements are the result
   * of applying the callback `f` to each child
   * of this SVG.
   */
  map<K>(f: (child: Renderable, index: number) => K) {
    return this.$children.map((child, index) => f(child, index));
  }

  /**
   * If called, ensures that all coordinates of
   * this SVG’s children are scaled according
   * to this SVG’s width and height.
   */
  done() {
    this.$children.forEach((c) => {
      c.fit([0, this.$width], [this.$height, 0], [0, 1]);
    });
    return this;
  }

  constructor(width: number, height: number) {
    this.$width = width;
    this.$height = height;
    this.$viewBox = `0 0 ${width} ${height}`;
    this.$preserveAspectRatio = "xMidYMid meet";
  }
  /**
   * Sets the `$preserveAspectRatio` property
   * for this SVG. Valid values are a string concatenation of
   * one of the following:
   *
   * 1. `xMin` - Align minimum x value of viewBox with left edge of viewport.
   * 2. `xMid` - Align midpoint x value of viewBox with horizontal
   *    center of viewport.
   * 3. `xMax` - Align maximum x value of viewBox with right edge of viewport.
   *
   * With one of the following:
   *
   * 1. `YMin` - Align minimum y value of viewBox with top edge of viewport.
   * 2. `YMid` - Align midpoint y value of viewBox with
   *    vertical center of viewport.
   * 3. `YMax` - Align maximum y value of viewBox with bottom edge of viewport.
   *
   * E.g., `xMidYMid` (the default value). A second argument, `meetOrSlice`
   * may be passed (defaults to `meet`).
   */
  preserveAspectRatio(value: PAR, meetOrSlice: "meet" | "slice" = "meet") {
    this.$preserveAspectRatio = `${value} ${meetOrSlice}`;
    return this;
  }
}

/**
 * Returns a new SVG object.
 */
export const svg = (width: number, height: number) => (
  new SVG(width, height)
);

enum PathCommandType {
  M,
  Z,
  L,
  A,
  Q,
  C,
}

// SVG Commands ----------------------------------------------------------------
/** An object representation of an SVG path command. */
abstract class PathCommand {
  /** Returns the string representation of this path command. */
  abstract toString(): string;
  $type: PathCommandType;

  /** The endpoint of this path command. */
  $end: Vector3D;

  /** A property indicating whether this path command is a relative command. */
  $relative: boolean = false;

  constructor(end: Vector3D, type: PathCommandType) {
    this.$end = end;
    this.$type = type;
  }

  /** Sets this path command as a relative command. */
  asRelative() {
    this.$relative = true;
    return this;
  }
}

/** An object corresponding to a moveto command. */
class MCommand extends PathCommand {
  constructor(end: Vector3D) {
    super(end, PathCommandType.M);
  }
  toString(): string {
    return `${this.$relative ? "m" : "M"}${this.$end.$x},${this.$end.$y}`;
  }
}

/** Returns a moveto command. */
const moveTo = (x: number, y: number, z: number = 1) => (
  new MCommand(v3D(x, y, z))
);

/** Returns true if the given command is an MCommand. */
const isMCommand = (command: PathCommand): command is MCommand => (
  command.$type === PathCommandType.M
);

/** An object corresponding to a lineto command. */
class ZCommand extends PathCommand {
  constructor(end: Vector3D) {
    super(end, PathCommandType.Z);
  }
  toString(): string {
    return `Z`;
  }
}
const zCommand = (endX: number, endY: number, endZ: number = 1) => (
  new ZCommand(v3D(endX, endY, endZ))
);

/** Returns true if the given command is a ZCommand.  */
const isZCommand = (command: PathCommand): command is ZCommand => (
  command.$type === PathCommandType.Z
);

/** An object corresponding to a lineto command. */
class LCommand extends PathCommand {
  constructor(end: Vector3D) {
    super(end, PathCommandType.L);
  }
  toString(): string {
    return `${this.$relative ? "l" : "L"}${this.$end.$x} ${this.$end.$y}`;
  }
}

/** Returns a lineto command. */
const lineTo = (x: number, y: number, z: number = 1) => (
  new LCommand(v3D(x, y, z))
);

const isLCommand = (command: PathCommand): command is LCommand => (
  command.$type === PathCommandType.L
);

/** An object corresponding to an arcto command. */
class ACommand extends PathCommand {
  constructor(
    rx: number,
    ry: number,
    xAxisRotation: number,
    largeArc: 0 | 1,
    sweep: 0 | 1,
    end: Vector3D,
  ) {
    super(end, PathCommandType.A);
    this.$rx = rx;
    this.$ry = ry;
    this.$xAxisRotation = xAxisRotation;
    this.$largeArc = largeArc;
    this.$sweep = sweep;
    this.$end = end;
  }

  /** The x-axis rotation. */
  $xAxisRotation: number = 0;

  /** Sets the x-axis rotation. */
  xAxisRotation(rotation: number) {
    this.$xAxisRotation = rotation;
    return this;
  }

  /** The x-radius. */
  $rx: number = 1;

  /** Sets the x-radius. */
  rx(r: number) {
    this.$rx = r;
    return this;
  }

  /** The y-radius. */
  $ry: number = 1;

  /** Sets the y-radius. */
  ry(r: number) {
    this.$ry = r;
    return this;
  }

  /** The large-arc-flag. */
  $largeArc: 0 | 1 = 0;

  /** Sets the large-arc-flag. */
  largeArc(value: 0 | 1) {
    this.$largeArc = value;
    return this;
  }

  /** The sweep flag. */
  $sweep: 0 | 1 = 0;

  /** Sets the sweep flag. */
  sweep(value: 0 | 1 = 0) {
    this.$sweep = value;
    return this;
  }

  toString(): string {
    return `${
      this.$relative ? "a" : "A"
    }${this.$rx},${this.$ry} ${this.$xAxisRotation}  ${this.$largeArc} ${this.$sweep} ${this.$end.$x},${this.$end.$y}`;
  }
}

/** Returns an arcto command. */
const arcTo = (
  rx: number,
  ry: number,
  xAxisRotation: number,
  largeArc: 0 | 1,
  sweep: 0 | 1,
  end: [number, number] | [number, number, number],
) => (
  new ACommand(
    rx,
    ry,
    xAxisRotation,
    largeArc,
    sweep,
    v3D(end[0], end[1], end[2] === undefined ? 1 : end[2]),
  )
);

/** Returns true if the given command is an ACommand. */
const isACommand = (command: PathCommand): command is ACommand => (
  command.$type === PathCommandType.A
);

/** An object corresponding to a quadratic Bezier curve command. */
class QCommand extends PathCommand {
  $control: Vector3D;
  constructor(control: Vector3D, end: Vector3D) {
    super(end, PathCommandType.Q);
    this.$control = control;
  }
  toString(): string {
    return `${
      this.$relative ? "q" : "Q"
    }${this.$control.$x},${this.$control.$y} ${this.$end.$x},${this.$end.$y}`;
  }
}

/** Returns an absolute quadratic Bezier curve command. */
const qbcTo = (
  control: [number, number] | [number, number, number],
  end: [number, number] | [number, number, number],
) => (
  new QCommand(
    v3D(control[0], control[1], control[2] === undefined ? 1 : control[2]),
    v3D(end[0], end[1], end[2] === undefined ? 1 : end[2]),
  )
);

/** Returns true if the given command is a QCommand. */
const isQCommand = (command: PathCommand): command is QCommand => (
  command.$type === PathCommandType.Q
);

/** An object corresponding to a cubic Bezier curve command. */
class CCommand extends PathCommand {
  $control1: Vector3D;
  $control2: Vector3D;
  constructor(control1: Vector3D, control2: Vector3D, end: Vector3D) {
    super(end, PathCommandType.C);
    this.$control1 = control1;
    this.$control2 = control2;
  }
  toString(): string {
    return `${
      this.$relative ? "c" : "C"
    }${this.$control1.$x},${this.$control1.$y} ${this.$control2.$x} ${this.$control2.$y} ${this.$end.$x},${this.$end.$y}`;
  }
}

/** Returns a cubic Bezier curve command. */
const cbcTo = (
  control1: [number, number] | [number, number, number],
  control2: [number, number] | [number, number, number],
  end: [number, number] | [number, number, number],
) => (
  new CCommand(
    v3D(control1[0], control1[1], control1[2] === undefined ? 1 : control1[2]),
    v3D(control2[0], control2[1], control2[2] === undefined ? 1 : control2[2]),
    v3D(end[0], end[1], end[2] === undefined ? 1 : end[2]),
  )
);

/** Returns true if the given command is a CCommand. */
const isCCommand = (command: PathCommand): command is CCommand => (
  command.$type === PathCommandType.C
);

interface Textual {
  /** This textual’s text alignment property. */
  $textAnchor?: "start" | "middle" | "end";

  /** Sets this textual’s text alignment property. */
  textAnchor(value: "start" | "middle" | "end"): this;

  /** This textual’s text decoration property. */
  $textDecoration?: string;

  /** Sets this textual’s text decoration property. */
  textDecoration(value: string): this;
  /**
   * The fill opacity for this fillable.
   */
  $fontSize?: string;

  /**
   * Sets the fill opacity for this fillable.
   * This method expects a number ranging from 0 to 1.
   * 0 is entirely transparent, and 1 (the default) is
   * entirely opaque.
   */
  fontSize(size: string): this;

  /**
   * This Textual’s font family.
   */
  $fontFamily?: string;

  /**
   * Sets this Textual’s font family.
   */
  fontFamily(font: string): this;
}

function textual<BaseClass extends Constructor>(
  BaseClass: BaseClass,
): MixOf<BaseClass, Textual> {
  return class extends BaseClass implements Textual {
    $textAnchor?: "start" | "middle" | "end";
    textAnchor(value: "start" | "middle" | "end"): this {
      this.$textAnchor = value;
      return this;
    }
    $textDecoration?: string;
    textDecoration(value: string): this {
      this.$textDecoration = value;
      return this;
    }
    $fontSize?: string;
    fontSize(size: string): this {
      this.$fontSize = size;
      return this;
    }
    $fontFamily?: string;
    fontFamily(font: string): this {
      this.$fontFamily = font;
      return this;
    }
  };
}

interface Fillable {
  /** The fill color for this fillable. The default is `"none"`. */
  $fill?: string;

  /** Sets the fill color for this fillable. */
  fill(color: string): this;

  /**
   * The fill opacity for this fillable.
   */
  $fillOpacity?: number;

  /**
   * Sets the fill opacity for this fillable.
   * This method expects a number ranging from 0 to 1.
   * 0 is entirely transparent, and 1 (the default) is
   * entirely opaque.
   */
  fillOpacity(opacity: number): this;
}

function fillable<BaseClass extends Constructor>(
  BaseClass: BaseClass,
): MixOf<BaseClass, Fillable> {
  return class extends BaseClass implements Fillable {
    $fill?: string;
    fill(color: string): this {
      this.$fill = color;
      return this;
    }
    $fillOpacity?: number;
    fillOpacity(opacity: number): this {
      this.$fillOpacity = clamp(0, opacity, 1);
      return this;
    }
  };
}

interface Strokable {
  /** The stroke’s thickness. */
  $strokeWidth?: number;

  /** Sets the stroke’s thickness. */
  strokeWidth(width: number): this;

  /** The stroke’s color. Defaults to `"initial"` */
  $stroke?: string;

  /** Sets the stroke’s color. */
  stroke(color: string): this;

  /** The stroke’s opacity. */
  $strokeOpacity?: number;

  /**
   * Sets the stroke’s opacity to the given value.
   * The value must be a number between 0 and 1.
   */
  strokeOpacity(value: number): this;

  /**
   * The stroke’s stroke dash array property.
   */
  $strokeDashArray?: string;

  /**
   * Sets the stroke’s stroke dash array property.
   */
  strokeDashArray(...values: number[]): this;
}

/**
 * A mixin function that inserts SVG fill
 * properties and methods.
 */
function strokable<BaseClass extends Constructor>(
  BaseClass: BaseClass,
): MixOf<BaseClass, Strokable> {
  return class extends BaseClass implements Strokable {
    $strokeWidth?: number;
    strokeWidth(width: number) {
      this.$strokeWidth = width;
      return this;
    }
    $stroke?: string;
    stroke(color: string) {
      this.$stroke = color;
      return this;
    }
    $strokeOpacity?: number;
    strokeOpacity(value: number) {
      this.$strokeOpacity = clamp(0, value, 1);
      return this;
    }
    $strokeDashArray?: string;
    strokeDashArray(...values: number[]) {
      this.$strokeDashArray = values.join(",");
      return this;
    }
  };
}

enum RENDERABLE_TYPE {
  RENDERABLE_PATH,
  RENDERABLE_GROUP,
  RENDERABLE_TEXT,
  RAW_PATH,
  RAW_GROUP,
  RAW_TEXT,
}

abstract class Renderable {
  abstract fit(
    parentXDomain: [number, number],
    parentYDomain: [number, number],
    parentZDomain: [number, number],
  ): this;

  /**
   * The type of this renderable. This property
   * may be set to one of the following:
   *
   * 1. `RENDERABLE_TYPE.RENDERABLE_PATH` - A Path object with
   *     the mixins of strokable and fillable.
   * 2. `RENDERABLE_TYPE.RENDERABLE_GROUP` - A Group object with
   *     the mixins of strokable and fillable.
   * 3. `RENDERABLE_TYPE.RAW_PATH` - A Path object without any
   *     mixins.
   * 4. `RENDERABLE_TYPE.RAW_GROUP` - A Group object without any
   *     mixins.
   */
  $type: RENDERABLE_TYPE;
  $coordinateSystem: CoordinateSystem = coord([-10, 10], [-10, 10], [-10, 10]);
  coordinateSystem(system: CoordinateSystem) {
    this.$coordinateSystem = system;
    return this;
  }
  constructor(type: RENDERABLE_TYPE) {
    this.$type = type;
  }
  /** Sets the type of this renderable. */
  typed(type: RENDERABLE_TYPE) {
    this.$type = type;
    return this;
  }
}

/**
 * An object corresponding to an SVG group.
 */
class Group extends Renderable {
  $children: Renderable[];
  constructor(children: Renderable[]) {
    super(RENDERABLE_TYPE.RAW_GROUP);
    this.$children = children;
  }

  coordinateSystem(system: CoordinateSystem): this {
    this.$coordinateSystem = system;
    this.$children.forEach((child) => {
      child.coordinateSystem(this.$coordinateSystem);
    });
    return this;
  }

  fit(
    parentXDomain: [number, number],
    parentYDomain: [number, number],
    parentZDomain: [number, number],
  ) {
    this.$children.forEach((c) => {
      c.fit(parentXDomain, parentYDomain, parentZDomain);
    });
    return this;
  }
}

const $GROUP = fillable(strokable(Group));

export type RenderableGroup = Group & Fillable & Strokable;

/**
 * Returns an object corresponding to an SVG group.
 */
export const group = (children: Renderable[]): RenderableGroup => (
  new $GROUP(children).typed(RENDERABLE_TYPE.RENDERABLE_GROUP)
);

/**
 * Returns true if the given `object` is a RenderableGroup, false otherwise.
 */
export const isGroup = (object: Renderable): object is RenderableGroup => (
  object.$type === RENDERABLE_TYPE.RENDERABLE_GROUP
);

class Text extends Renderable {
  $position: Vector3D = v3D(0, 0, 1);

  /** Sets the position of this text element. */
  at(x: number, y: number, z: number = 1) {
    this.$position = v3D(x, y, z);
    return this;
  }

  $text: string;
  constructor(text: string) {
    super(RENDERABLE_TYPE.RAW_TEXT);
    this.$text = text;
  }

  fit(
    parentXDomain: [number, number],
    parentYDomain: [number, number],
    parentZDomain: [number, number],
  ): this {
    const xDomain = this.$coordinateSystem.$xDomain;
    const yDomain = this.$coordinateSystem.$yDomain;
    const zDomain = this.$coordinateSystem.$zDomain;
    const xscale = range(xDomain, parentXDomain);
    const yscale = range(yDomain, parentYDomain);
    const zscale = range(zDomain, parentZDomain);
    this.$position = v3D(
      xscale(this.$position.$x),
      yscale(this.$position.$y),
      zscale(this.$position.$z),
    );
    return this;
  }
}

const $TEXT = fillable(textual(Text));

export type RenderableText = Text & Textual & Fillable;

/** Returns an object corresponding to an SVG text element. */
export const text = (textContent: string): RenderableText => (
  new $TEXT(textContent).typed(RENDERABLE_TYPE.RENDERABLE_TEXT)
);

/** Returns true if the given renderable is a Text object. */
export const isText = (object: Renderable): object is RenderableText => (
  object.$type === RENDERABLE_TYPE.RENDERABLE_TEXT
);

/** An object corresponding to an SVG path. */
class Path extends Renderable {
  fit(
    parentXDomain: [number, number],
    parentYDomain: [number, number],
    parentZDomain: [number, number],
  ) {
    const xDomain = this.$coordinateSystem.$xDomain;
    const yDomain = this.$coordinateSystem.$yDomain;
    const zDomain = this.$coordinateSystem.$zDomain;
    const xscale = range(xDomain, parentXDomain);
    const yscale = range(yDomain, parentYDomain);
    const zscale = range(zDomain, parentZDomain);
    this.$commands.forEach((command) => {
      command.$end = v3D(
        xscale(command.$end.$x),
        yscale(command.$end.$y),
        zscale(command.$end.$z),
      );
      if (isQCommand(command)) {
        command.$control = v3D(
          xscale(command.$control.$x),
          yscale(command.$control.$y),
          zscale(command.$control.$z),
        );
      }
      if (isCCommand(command)) {
        command.$control1 = v3D(
          xscale(command.$control1.$x),
          yscale(command.$control1.$y),
          zscale(command.$control1.$z),
        );
        command.$control2 = v3D(
          xscale(command.$control2.$x),
          yscale(command.$control2.$y),
          zscale(command.$control2.$z),
        );
      }
    });
    return this;
  }
  /** The list of commands comprising this SVG path. */
  $commands: PathCommand[] = [];

  /** The current position of the path’s cursor. */
  $cursor: Vector3D;

  constructor(startX: number, startY: number, startZ: number = 1) {
    super(RENDERABLE_TYPE.RAW_PATH);
    this.$commands = [moveTo(startX, startY, startZ)];
    this.$cursor = v3D(startX, startY, startZ);
  }

  /**
   * Appends a `Z` command to this path’s command list
   * (i.e., closes this path).
   */
  Z() {
    this.$commands.push(
      zCommand(this.$cursor.$x, this.$cursor.$y, this.$cursor.$z),
    );
    return this;
  }

  /**
   * Returns the path command string for this SVG path.
   * I.e., the value taken by the `d` attribute for
   * the <path> element.
   */
  toString() {
    const out = this.$commands.map((command) => command.toString()).join("");
    return out;
  }

  /** Appends to this path’s command list an absolute moveto command. */
  M(x: number, y: number, z: number = 1) {
    this.$commands.push(moveTo(x, y, z));
    this.$cursor = v3D(x, y, z);
    return this;
  }

  /** Appends to this path’s command list a relative moveto command. */
  m(x: number, y: number, z: number = 1) {
    this.$commands.push(moveTo(x, y, z).asRelative());
    this.$cursor = v3D(
      this.$cursor.$x + x,
      this.$cursor.$y + y,
      this.$cursor.$z + z,
    );
    return this;
  }

  /** Appends to this path’s command list an absolute lineto command. */
  L(x: number, y: number, z: number = 1) {
    this.$commands.push(lineTo(x, y, z));
    this.$cursor = v3D(x, y, z);
    return this;
  }

  /** Appends to this path’s command list a relative lineto command. */
  l(x: number, y: number, z: number = 1) {
    this.$commands.push(lineTo(x, y, z).asRelative());
    this.$cursor = v3D(
      this.$cursor.$x + x,
      this.$cursor.$y + y,
      this.$cursor.$z + z,
    );
    return this;
  }

  /** Appends to this path’s command list an absolute arcto command. */
  A(
    rx: number,
    ry: number,
    xAxisRotation: number,
    largeArc: 0 | 1,
    sweep: 0 | 1,
    end: [number, number] | [number, number, number],
  ) {
    const a = arcTo(rx, ry, xAxisRotation, largeArc, sweep, end);
    this.$commands.push(a);
    this.$cursor = v3D(
      a.$end.$x,
      a.$end.$y,
      a.$end.$z,
    );
    return this;
  }

  /** Appends to this path’s command list a relative arcto command. */
  a(
    rx: number,
    ry: number,
    xAxisRotation: number,
    largeArc: 0 | 1,
    sweep: 0 | 1,
    end: [number, number] | [number, number, number],
  ) {
    const a = arcTo(rx, ry, xAxisRotation, largeArc, sweep, end);
    this.$commands.push(a.asRelative());
    this.$cursor = v3D(
      this.$cursor.$x + a.$end.$x,
      this.$cursor.$y + a.$end.$y,
      this.$cursor.$z + a.$end.$z,
    );
    return this;
  }

  /**
   * Appends to this path’s command list an
   * absolute quadratic Bezier curve command.
   */
  Q(
    control: [number, number] | [number, number, number],
    end: [number, number] | [number, number, number],
  ) {
    const q = qbcTo(control, end);
    this.$commands.push(q);
    this.$cursor = v3D(
      q.$end.$x,
      q.$end.$y,
      q.$end.$z,
    );
    return this;
  }

  /**
   * Appends to this path’s command list a
   * relative quadratic Bezier curve command.
   */
  q(
    control: [number, number] | [number, number, number],
    end: [number, number] | [number, number, number],
  ) {
    const q = qbcTo(control, end);
    this.$commands.push(q.asRelative());
    this.$cursor = v3D(
      this.$cursor.$x + q.$end.$x,
      this.$cursor.$y + q.$end.$y,
      this.$cursor.$z + q.$end.$z,
    );
    return this;
  }

  /**
   * Appends to this path’s command list an
   * absolute cubic Bezier curve command.
   */
  C(
    control1: [number, number] | [number, number, number],
    control2: [number, number] | [number, number, number],
    end: [number, number] | [number, number, number],
  ) {
    const c = cbcTo(control1, control2, end);
    this.$commands.push(c);
    this.$cursor = v3D(c.$end.$x, c.$end.$y, c.$end.$z);
    return this;
  }

  /**
   * Appends to this path’s command list a relative
   * cubic Bezier curve command.
   */
  c(
    control1: [number, number] | [number, number, number],
    control2: [number, number] | [number, number, number],
    end: [number, number] | [number, number, number],
  ) {
    const c = cbcTo(control1, control2, end);
    this.$commands.push(c.asRelative());
    this.$cursor = v3D(
      this.$cursor.$x + c.$end.$x,
      this.$cursor.$y + c.$end.$y,
      this.$cursor.$z + c.$end.$z,
    );
    return this;
  }
}
const $PATH = fillable(strokable(Path));

/**
 * An object corresponding to an SVG path,
 * with stroke and fill properties/methods.
 */
export type RenderablePath = Path & Strokable & Fillable;

/**
 * Returns a new RenderablePath (an object corresponding
 * to an SVG path, with stroke and fill properties/methods).
 */
export const path = (
  startX: number,
  startY: number,
  startZ: number = 0,
): RenderablePath => (new $PATH(startX, startY, startZ).typed(
  RENDERABLE_TYPE.RENDERABLE_PATH,
));

/**
 * Returns true if the given object is a RenderablePath.
 */
export const isPath = (object: Renderable): object is RenderablePath => (
  object.$type === RENDERABLE_TYPE.RENDERABLE_PATH
);

/** Returns a path corresponding to a line. */
export const line2D = (start: [number, number], end: [number, number]) => (
  path(start[0], start[1]).L(end[0], end[1])
);

abstract class Composite {
  abstract path(): Renderable;
}

export const grid2D = (
  xDomain: [number, number],
  yDomain: [number, number],
  increment: number,
) => {
  const elements = [];
  const xMin = xDomain[0];
  const xMax = xDomain[1];
  const yMin = yDomain[0];
  const yMax = yDomain[1];
  for (let x = xDomain[0]; x <= xDomain[1]; x += increment) {
    elements.push(line2D([x, yMin], [x, yMax]));
    // elements.push(text(`${x}`).at(x-.2, -.4).fontSize('4px'));
  }
  for (let y = yDomain[0]; y <= yDomain[1]; y += increment) {
    elements.push(line2D([xMin, y], [xMax, y]));
    // elements.push(text(`${y}`).at(-.4, y-.2).fontSize('4px'));
  }
  return group(elements);
};

class Circle extends Composite {
  $radius: number = 1;
  r(radius: number) {
    this.$radius = radius;
    return this;
  }
  $position: [number, number, number];
  at(x: number, y: number, z: number = 1) {
    this.$position = [x, y, z];
    return this;
  }
  get $cy() {
    return this.$position[1];
  }
  get $cx() {
    return this.$position[0];
  }
  get $cz() {
    return this.$position[2];
  }
  constructor(positionX: number, positionY: number, positionZ: number = 1) {
    super();
    this.$position = [positionX, positionY, positionZ];
  }
  path() {
    const out = path(
      this.$cx,
      this.$cy + this.$radius,
    ).A(1, 1, 0, 0, 0, [this.$cx, this.$cy - this.$radius, this.$cz]).A(
      1,
      1,
      0,
      0,
      0,
      [this.$cx, this.$cy + this.$radius, this.$cz],
    );
    return out;
  }
}

/** Returns an object corresponding to a circle. */
export const circle = (x: number, y: number, z: number = 1) => (
  new Circle(x, y, z)
);

/** An object corresponding to a 2D function plot. */
class Plot2D extends Composite {
  $f: string;
  /** The number of samples this Plot2D takes to plot this function. */
  $samples: number = 800;

  /**
   * Sets the number of samples to take to plot this function.
   * Defaults to `800`. More samples will result in a finer
   * plot, but at the cost of performance.
   */
  samples(count: number) {
    this.$samples = count;
    return this;
  }

  /** The domain for this Plot2D’s function. */
  $domain: [number, number];

  /** Sets the domain for this Plot2D. */
  domain(interval: [number, number]) {
    this.$domain = interval;
    return this;
  }

  /** The range for this Plot2D’s function. */
  $range: [number, number];

  /** Sets the range for this Plot2D. */
  range(interval: [number, number]) {
    this.$range = interval;
    return this;
  }

  constructor(f: string, domain: [number, number], range: [number, number]) {
    super();
    this.$f = f;
    this.$domain = domain;
    this.$range = range;
  }

  path() {
    const xmin = this.$domain[0];
    const xmax = this.$domain[1];
    const ymin = this.$range[0];
    const ymax = this.$range[1];
    const engine = compiler();
    const out: PathCommand[] = [];
    const f = engine.execute(`fn ${this.$f};`);
    if (!isCallable(f)) {
      return path(0, 0, 0);
    }
    const dataset: [number, number][] = [];
    for (let i = -this.$samples; i < this.$samples; i++) {
      const x = (i / this.$samples) * xmax;
      const _y = f.call(engine.engine, [x]);
      if (typeof _y !== "number") continue;
      const y = _y;
      const point: [number, number] = [x, y];
      if (Number.isNaN(y) || y < ymin || ymax < y) {
        point[1] = NaN;
      }
      if (x < xmin || xmax < x) continue;
      else dataset.push(point);
    }
    let moved = false;
    for (let i = 0; i < dataset.length; i++) {
      const datum = dataset[i];
      if (!Number.isNaN(datum[1])) {
        if (!moved) {
          out.push(moveTo(datum[0], datum[1], 1));
          moved = true;
        } else {
          out.push(lineTo(datum[0], datum[1], 1));
        }
      } else {
        const next = dataset[i + 1];
        if (next !== undefined && !Number.isNaN(next[1])) {
          out.push(moveTo(next[0], next[1], 1));
        }
      }
    }
    const p = path(out[0].$end.$x, out[0].$end.$y, out[0].$end.$z);
    for (let i = 1; i < out.length; i++) {
      p.$commands.push(out[i]);
    }
    return p;
  }
}
export const plot2D = (
  f: string,
  domain: [number, number],
  range: [number, number],
) => (
  new Plot2D(f, domain, range)
);
