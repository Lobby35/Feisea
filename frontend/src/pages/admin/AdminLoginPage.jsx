import React, { useState } from 'react';
import { api } from '../../api';
import Field from '../../components/Field';
import Notice from '../../components/Notice';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function login(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await api.login('admin', { email, password });
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && /^\/admin\/(dashboard|users|offers|companies(?:\/[1-9][0-9]*)?)$/.test(next)) window.location.assign(next);
      else window.location.assign('/admin/dashboard');
    } catch (error) { setMessage(error.message); setBusy(false); }
  }
  return <><h1>Administrator login</h1><Notice>{message}</Notice>
    <form onSubmit={login}><fieldset disabled={busy}><legend>Account details</legend>
      <Field name="email" label="Email" type="email" value={email} onChange={setEmail} required autoComplete="username" />
      <Field name="password" label="Password" type="password" value={password} onChange={setPassword} required maxLength={1024} autoComplete="current-password" />
      <button type="submit">Log in</button>
    </fieldset></form>
  </>;
}
