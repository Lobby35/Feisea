import React from 'react';
import { useState } from 'react';
import { api } from '../../api';
import Field from '../../components/Field';
import NameFields from '../../components/NameFields';
import Notice from '../../components/Notice';

export default function AccountPage({ role, register }) {
  const title = role === 'candidate' ? 'Candidate' : 'Company';
  const [fields, setFields] = useState({ name: '', surname: '', second_surname: '', company_name: '', email: '', password: '', password_confirmation: '' });
  const [message, setMessage] = useState(() => new URLSearchParams(window.location.search).has('registered') ? 'Account created. Check your email to verify it before logging in.' : '');
  const [busy, setBusy] = useState(false);
  const change = name => value => setFields(old => ({ ...old, [name]: value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (register) {
        const body = { ...fields };
        if (role === 'candidate') delete body.company_name;
        await api.register(role, body);
        window.location.assign(`/${role}/login?registered=1`);
      } else {
        const result = await api.login(role, { email: fields.email, password: fields.password });
        window.location.assign(`/${role}/${result.user.onboarding_completed_at ? 'dashboard' : 'setup'}`);
      }
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true);
    try { setMessage((await api.resend(role, fields.email)).message); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <>
    <h1>{title} {register ? 'registration' : 'login'}</h1>
    <Notice>{message}</Notice>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>{register ? role === 'company' ? 'Company contact details' : 'Create your account' : 'Account details'}</legend>
        {register && <NameFields values={fields} onChange={change} />}
        {register && role === 'company' && <Field label="Company name" name="company_name" value={fields.company_name} onChange={change('company_name')} required maxLength={200} autoComplete="organization" />}
        <Field label="Email" name="email" type="email" value={fields.email} onChange={change('email')} required maxLength={254} autoComplete="email" />
        <Field label="Password" name="password" type="password" value={fields.password} onChange={change('password')} required minLength={register ? 12 : undefined} maxLength={register ? 72 : 1024} pattern={register ? '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,72}' : undefined} title={register ? 'At least 12 characters, with uppercase and lowercase letters, a number and a symbol.' : undefined} autoComplete={register ? 'new-password' : 'current-password'} />
        {register && <Field label="Confirm password" name="password_confirmation" type="password" value={fields.password_confirmation} onChange={change('password_confirmation')} required maxLength={72} autoComplete="new-password" />}
        {register && <p>Use at least 12 characters, including uppercase and lowercase letters, a number and a symbol. Maximum 72 bytes. Verify your email before logging in.</p>}
        <button type="submit">{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</button>
      </fieldset>
    </form>
    <p><a href={`/${role}/${register ? 'login' : 'register'}`}>{register ? 'Already registered? Log in' : 'Create an account'}</a></p>
    {!register && <p>Enter your email above, then <button disabled={busy} type="button" onClick={resend}>Resend verification email</button>.</p>}
  </>;
}
