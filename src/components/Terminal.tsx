import { useState } from 'react';
import css from './Terminal.module.scss';
import { compiler, strof, svg, path, isPath } from '../lib/main';

const Sketch = () => {
  const p = path(10, 10).Q([20, 20], [10, 40]).stroke('firebrick');
  const s = svg(200, 200).child(p);
  return (
    <svg viewBox={s.$viewBox} preserveAspectRatio={s.$preserveAspectRatio}>
      {s.map((c, i) => {
        if (isPath(c)) {
          return (
            <path
              key={`path-${i}`}
              d={c.toString()}
              stroke={c.$stroke}
              strokeWidth={c.$strokeWidth}
              fill={'none'}
            />
          );
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
