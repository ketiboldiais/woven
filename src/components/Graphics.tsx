import {
  RenderablePath,
  RenderableGroup,
  isPath,
  isGroup,
  isText,
  RenderableText,
  coord,
  line2D,
  group,
  plot2D,
  grid2D,
  svg,
} from '../lib/graphics';
import { tuple } from '../lib/math';

const Path = ({ of }: { of: RenderablePath }) => (
  <path
    d={of.toString()}
    stroke={of.$stroke}
    strokeWidth={of.$strokeWidth}
    fill={of.$fill}
    fillOpacity={of.$fillOpacity}
    strokeDasharray={of.$strokeDashArray}
  />
);

const Group = ({ of }: { of: RenderableGroup }) => (
  <g
    stroke={of.$stroke}
    strokeWidth={of.$strokeWidth}
    fill={of.$fill}
    fillOpacity={of.$fillOpacity}
    strokeDasharray={of.$strokeDashArray}
  >
    {of.$children.map((c, i) => {
      if (isPath(c)) {
        return <Path of={c} key={`path-${i}`} />;
      } else if (isGroup(c)) {
        return <Group of={c} key={`group-${i}`} />;
      } else if (isText(c)) {
        return <Text of={c} key={`text-${i}`} />;
      }
      {
        return <></>;
      }
    })}
  </g>
);

const Text = ({ of }: { of: RenderableText }) => (
  <text
    x={of.$position.$x}
    y={of.$position.$y}
    fontSize={of.$fontSize}
    fontFamily={of.$fontFamily}
    fill={of.$fill}
    textDecoration={of.$textDecoration}
    textAnchor={of.$textAnchor}
  >
    {of.$text}
  </text>
);

export const FPlot2D = ({
  fn,
}: {
  /**
   * The function to plot.
   * This is a string of the form `f(x) = E`,
   * where `f` is the name of the function, `x`
   * is the variable, and `E` is expression
   * corresponding to the rule of assignment.
   */
  fn: string;
}) => {
  const xdomain = tuple(-5, 5);
  const ydomain = tuple(-5, 5);
  const gridIncrement = 1;
  const cs = coord(xdomain, ydomain);
  const xAxis = line2D([-10, 0], [10, 0]);
  const yAxis = line2D([0, -10], [0, 10]);
  const axes = group([xAxis, yAxis]).stroke('grey').strokeWidth(0.5);
  const curve = plot2D(`${fn}`, xdomain, ydomain);
  const elements = group([
    axes,
    grid2D(xdomain, ydomain, gridIncrement).stroke('lightgrey').strokeWidth(0.25),
    curve.path().fill('none').stroke('red'),
  ]).coordinateSystem(cs);

  const s = svg(250, 250).children([elements]).done();

  return (
    <svg viewBox={s.$viewBox} preserveAspectRatio={s.$preserveAspectRatio}>
      {s.map((c, i) => {
        if (isPath(c)) {
          return <Path of={c} key={`path-${i}`} />;
        } else if (isGroup(c)) {
          return <Group of={c} key={`group-${i}`} />;
        } else if (isText(c)) {
          return <Text of={c} key={`text-${i}`} />;
        } else {
          return <></>;
        }
      })}
    </svg>
  );
};

export const Test = () => {
  const xdomain = tuple(-5, 5);
  const ydomain = tuple(-5, 5);
  const gridIncrement = 1;
  const cs = coord(xdomain, ydomain);
  const xAxis = line2D([-10, 0], [10, 0]);
  const yAxis = line2D([0, -10], [0, 10]);
  const axes = group([xAxis, yAxis]).stroke('grey').strokeWidth(0.5);
  const curve = plot2D(`f(x) = x^2`, xdomain, ydomain);
  const elements = group([
    axes,
    grid2D(xdomain, ydomain, gridIncrement).stroke('lightgrey').strokeWidth(0.25),
    curve.path().fill('none').stroke('red'),
  ]).coordinateSystem(cs);

  const s = svg(250, 250).children([elements]).done();

  return (
    <svg viewBox={s.$viewBox} preserveAspectRatio={s.$preserveAspectRatio}>
      {s.map((c, i) => {
        if (isPath(c)) {
          return <Path of={c} key={`path-${i}`} />;
        } else if (isGroup(c)) {
          return <Group of={c} key={`group-${i}`} />;
        } else if (isText(c)) {
          return <Text of={c} key={`text-${i}`} />;
        } else {
          return <></>;
        }
      })}
    </svg>
  );
};
