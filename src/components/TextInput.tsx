import { ChangeEvent } from 'react';

export const TextInput = ({
  label,
  value,
  onChange,
}: {
  /** The text input’s label. */
  label: string;
  /** The value of this text input. */
  value: string;
  /** The on-change handler. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <section className={'text-input'}>
      <label>{label}</label>
      <input type={'text'} value={value} onChange={(e) => onChange(e)} />
    </section>
  );
};
