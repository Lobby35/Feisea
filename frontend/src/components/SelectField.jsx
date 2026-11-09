import React from 'react';

export default function SelectField({ name, label, value, onChange, options, required = false, multiple = false }) {
  function change(event) {
    if (multiple) onChange(Array.from(event.target.selectedOptions, option => Number(option.value)));
    else onChange(event.target.value);
  }
  return <p><label htmlFor={name}>{label}</label><br />
    <select id={name} name={name} value={value} onChange={change} required={required} multiple={multiple} size={multiple ? 6 : undefined}>
      {!multiple && <option value="">Select…</option>}
      {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  </p>;
}
