import React, { useState } from 'react';
import { api } from '../../api';
import Field from '../../components/Field';
import Notice from '../../components/Notice';

export default function VerificationRequestPage({ role }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { setMessage((await api.resend(role, email)).message); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <>
    <h1>{role === 'candidate' ? 'Candidate' : 'Company'} email verification</h1>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>Verification email</legend>
        <Field label="Email" name="email" type="email" value={email} onChange={setEmail} required maxLength={254} autoComplete="email" />
        <button type="submit">{busy ? 'Please wait…' : 'Send verification email'}</button>
      </fieldset>
    </form>
    <Notice>{message}</Notice>
    <p><a href={`/${role}/register`}>Back to registration</a>{' · '}<a href={`/${role}/login`}>Log in</a></p>
  </>;
}
