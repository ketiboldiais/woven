import { useState } from 'react';
import css from './Terminal.module.scss';
import { compiler, strof, svg, path } from '../lib/main';

const Sketch = () => {
  const s = svg(200, 200);
  const p = path(10, 10).Q([20, 20], [10, 40]).stroke('firebrick');
  return (
    <svg viewBox={s.$viewBox} preserveAspectRatio={s.$preserveAspectRatio}>
      <path d={p.toString()} stroke={p.$stroke} strokeWidth={p.$strokeWidth} fill={'none'} />
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
