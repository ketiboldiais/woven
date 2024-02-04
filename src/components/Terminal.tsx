import { useState } from 'react';
import css from './Terminal.module.scss';
import {
  compiler,
  strof,
  svg,
  isPath,
  isGroup,
  RenderablePath,
  RenderableGroup,
  group,
  line2D,
  grid2D,
  coord,
  plot2D,
  tuple,
  circle,
  text,
  RenderableText,
  isText,
} from '../lib/main';

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
    x={of.$position.x}
    y={of.$position.y}
    fontSize={of.$fontSize}
    fontFamily={of.$fontFamily}
    fill={of.$fill}
    textDecoration={of.$textDecoration}
    textAnchor={of.$textAnchor}
  >
    {of.$text}
  </text>
);

const Sketch = () => {
  const xdomain = tuple(-2, 10);
  const ydomain = tuple(-2, 10);
  const gridIncrement = 1;
  const cs = coord(xdomain, ydomain);
  const xAxis = line2D([-10, 0], [10, 0]);
  const yAxis = line2D([0, -10], [0, 10]);
  const axes = group([xAxis, yAxis]).stroke('grey').strokeWidth(0.5);
  const curve = plot2D(`f(x) = ln(x)`, xdomain, ydomain);
  const txt = text('(3,3)').at(3, 3).fontSize('8px').textAnchor('middle');
  const elements = group([
    axes,
    grid2D(xdomain, ydomain, gridIncrement).stroke('lightgrey').strokeWidth(0.25),
    curve.path().fill('none').stroke('red'),
    circle(3, 3).r(0.1).path().fill('slategrey'),
    txt,
  ]).coordinateSystem(cs);
  const s = svg(250,250).children([elements]).done();

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

export default function Terminal() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const clear = () => {
    setCode('');
    setOutput('');
  };
  const tokenize = () => {
    const outputText = compiler().tokens(code);
    setOutput(outputText);
  };
  const execute = () => {
    const outputText = compiler().execute(code);
    setOutput(strof(outputText));
  };
  const parse = () => {
    const outpuText = compiler().ast(code);
    setOutput(outpuText);
  };
  return (
    <div className={css.terminal}>
      <div>
        <button onClick={() => tokenize()}>Tokenize</button>
        <button onClick={() => parse()}>Parse</button>
        <button onClick={() => execute()}>Execute</button>
        <button onClick={() => clear()}>Clear</button>
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <pre>{output}</pre>
      <Sketch />
    </div>
  );
}
