import { useState } from 'react';
import { FPlot2D } from './Graphics';
import { TextInput } from './TextInput';

export const FunctionPlotter = () => {
  const [f, setF] = useState('');
  const [plot, setPlot] = useState(false);
  const render = () => setPlot(true);
  const updateF = (value:string) => {
    setPlot(false);
    setF(value);
  }
  return (
    <div>
      <TextInput 
				label={'Function'} 
				value={f} 
				onChange={(e) => updateF(e.target.value)}
			/>
      <button onClick={() => render()}>Render</button>
      {plot && f && <FPlot2D fn={f} />}
    </div>
  );
};
