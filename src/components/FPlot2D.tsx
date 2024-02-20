import { useState } from 'react';
import { FPlot2D } from './Graphics';
import { TextInput } from './TextInput';

export const FunctionPlotter = () => {
  const [f, setF] = useState('');
  const [plot, setPlot] = useState(false);
  const render = () => setPlot(true);
  return (
    <div>
      <TextInput 
				label={'Function'} 
				value={f} 
				onChange={(e) => setF(e.target.value)}
			/>
      <button onClick={() => render()}>Render</button>
      {plot && f && <FPlot2D fn={f} />}
    </div>
  );
};
