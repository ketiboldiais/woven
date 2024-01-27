import { useState } from 'react';
import css from './Terminal.module.scss';
import { compiler } from '../lib/main';

export default function Terminal() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const tokenize = () => {
    const outputText = compiler().tokens(code);
    setOutput(outputText);
  };
  const parse = () => {
    const outpuText = compiler().ast(code);
    setOutput(outpuText);
  }
  return (
    <div className={css.terminal}>
      <div>
        <button onClick={() => tokenize()}>Tokenize</button>
        <button onClick={() => parse()}>Parse</button>
        <button>Execute</button>
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <pre>{output}</pre>
    </div>
  );
}
