import React from 'react';
import { useState } from 'react';
import { api } from '../../api';
import Field from '../../components/Field';
import NameFields from '../../components/NameFields';
import Notice from '../../components/Notice';
import PasswordChecklist from '../../features/auth/PasswordChecklist';
import { passwordRequirements } from '../../features/auth/passwordRequirements';

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
        else for (const key of ['name', 'surname', 'second_surname']) delete body[key];
        await api.register(role, body);
        window.location.assign(`/${role}/login?registered=1`);
      } else {
        const result = await api.login(role, { email: fields.email, password: fields.password });
        window.location.assign(`/${role}/${result.user.onboarding_completed_at ? 'dashboard' : 'setup'}`);
      }
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <>
    <h1>{title} {register ? 'registration' : 'login'}</h1>
    <Notice>{message}</Notice>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>{register ? role === 'company' ? 'Company details' : 'Create your account' : 'Account details'}</legend>
        {register && role === 'candidate' && <NameFields values={fields} onChange={change} />}
        {register && role === 'company' && <Field label="Company name" name="company_name" value={fields.company_name} onChange={change('company_name')} required maxLength={200} autoComplete="organization" />}
        <Field label="Email" name="email" type="email" value={fields.email} onChange={change('email')} required maxLength={254} autoComplete="email" />
        <Field label="Password" name="password" type="password" value={fields.password} onChange={change('password')} required aria-describedby={register ? 'password-requirements' : undefined} minLength={register ? 12 : undefined} maxLength={register ? 72 : 1024} onInput={event => { if (register) event.target.setCustomValidity(passwordRequirements(event.target.value).every(item => item.met) ? '' : 'Meet all password requirements.'); }} autoComplete={register ? 'new-password' : 'current-password'} />
        {register && <Field label="Confirm password" name="password_confirmation" type="password" value={fields.password_confirmation} onChange={change('password_confirmation')} required maxLength={72} autoComplete="new-password" />}
        {register && <PasswordChecklist password={fields.password} />}
        <button type="submit">{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</button>
      </fieldset>
    </form>
    <p><a href={`/${role}/${register ? 'login' : 'register'}`}>{register ? 'Already registered? Log in' : 'Create an account'}</a></p>
    {register && <p><button type="button" onClick={() => window.location.assign(`/${role}/verification`)}>Resend verification email</button></p>}
  </>;
}
