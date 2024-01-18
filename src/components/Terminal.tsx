import { useState } from 'react';
import css from './Terminal.module.scss';
import { lexicalAnalysis } from '../lib/main';

export default function Terminal() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const tokenize = () => {
    const result = lexicalAnalysis(code).stream();
    let outputText = '';
    result.map((t) => {
      t.forEach((token) => {
				outputText = outputText + token.toString() + '\n' 
      });
    });
    setOutput(outputText);
  };
  return (
    <div className={css.terminal}>
      <div>
        <button onClick={() => tokenize()}>Tokenize</button>
        <button>Parse</button>
        <button>Execute</button>
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <pre>{output}</pre>
    </div>
  );
}
