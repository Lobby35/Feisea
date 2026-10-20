import React from 'react';
export default function Field({ label, name, value, onChange, type = 'text', required = false, ...props }) {
  return <p><label>{label}<br /><input name={name} type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} required={required} {...props} /></label></p>;
}
