import React from 'react';
import { passwordRequirements } from './passwordRequirements';

export default function PasswordChecklist({ password }) {
  return <ul id="password-requirements" aria-label="Password requirements" aria-live="polite">
    {passwordRequirements(password).map(({ label, met }) => <li key={label} aria-label={`${label}: ${met ? 'met' : 'not met'}`}>
      {met ? <s>{label}</s> : label}
    </li>)}
  </ul>;
}
