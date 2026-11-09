import React, { useId } from 'react';

export default function TownField({ towns, value, onChange, name = 'city', required = false }) {
  const id = useId();
  return <p><label htmlFor={id}>Town or city</label><br />
    <input id={id} name={name} list={`${id}-towns`} value={value} onChange={event => onChange(event.target.value)} required={required} autoComplete="off" />
    <datalist id={`${id}-towns`}>{towns.map(town => <option key={town.code} value={town.name} />)}</datalist>
  </p>;
}
