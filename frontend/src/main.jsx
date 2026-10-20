import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';

function Field({ label, name, value, onChange, type = 'text', required = false, ...props }) {
  return <p><label>{label}<br /><input name={name} type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} {...props} /></label></p>;
}

function Notice({ children }) {
  return children ? <p role="status" aria-live="polite">{children}</p> : null;
}

function AccountPage({ role, register }) {
  const title = role === 'candidate' ? 'Candidate' : 'Company';
  const [fields, setFields] = useState({ name: '', company_name: '', email: '', password: '', password_confirmation: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const change = name => value => setFields(old => ({ ...old, [name]: value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (register) {
        const body = { ...fields };
        if (role === 'candidate') delete body.company_name;
        const result = await api.register(role, body);
        setFields(old => ({ ...old, password: '', password_confirmation: '' }));
        setMessage(result.message);
      } else {
        await api.login(role, { email: fields.email, password: fields.password });
        window.location.assign(`/${role}/dashboard`);
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
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>{register ? 'Create your account' : 'Account details'}</legend>
        {register && <Field label={role === 'company' ? 'Contact name' : 'Full name'} name="name" value={fields.name} onChange={change('name')} required maxLength={150} autoComplete="name" />}
        {register && role === 'company' && <Field label="Company name" name="company_name" value={fields.company_name} onChange={change('company_name')} required maxLength={200} autoComplete="organization" />}
        <Field label="Email" name="email" type="email" value={fields.email} onChange={change('email')} required maxLength={254} autoComplete="email" />
        <Field label="Password" name="password" type="password" value={fields.password} onChange={change('password')} required minLength={register ? 8 : undefined} maxLength={register ? 72 : 1024} autoComplete={register ? 'new-password' : 'current-password'} />
        {register && <Field label="Confirm password" name="password_confirmation" type="password" value={fields.password_confirmation} onChange={change('password_confirmation')} required maxLength={72} autoComplete="new-password" />}
        {register && <p>Use at least 8 characters. You will need to verify your email before logging in.</p>}
        <button type="submit">{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</button>
      </fieldset>
    </form>
    <Notice>{message}</Notice>
    <p><a href={`/${role}/${register ? 'login' : 'register'}`}>{register ? 'Already registered? Log in' : 'Create an account'}</a></p>
    {!register && <p>Enter your email above, then <button disabled={busy} type="button" onClick={resend}>Resend verification email</button>.</p>}
  </>;
}

function VerifyPage() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  const [message, setMessage] = useState('Verifying your email…');
  const [role, setRole] = useState(null);
  useEffect(() => {
    window.history.replaceState(null, '', '/verify-email');
    if (!token) { setMessage('This verification link is incomplete. Request a new email from the login page.'); return; }
    api.verify(token).then(result => { setMessage(result.message); setRole(result.role); }).catch(error => setMessage(error.message));
  }, [token]);
  return <><h1>Email verification</h1><Notice>{message}</Notice>{role && <p><a href={`/${role}/login`}>Continue to {role === 'candidate' ? 'candidate' : 'company'} login</a></p>}</>;
}

function UploadForm({ title, kind, role, disabled, onResult, onError }) {
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    try { onResult(await api.upload(role, kind, new FormData(form))); form.reset(); }
    catch (error) { onError(error.message); }
  }
  return <form onSubmit={submit}>
    <fieldset disabled={disabled}>
      <legend>{title}</legend>
      <p><label>{kind === 'photo' ? 'JPEG, PNG or WebP, up to 2 MB' : 'PDF, up to 10 MB'}<br /><input type="file" name="file" required accept={kind === 'photo' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} /></label></p>
      <button type="submit">Upload {kind === 'photo' ? 'photo' : 'CV'}</button>
    </fieldset>
  </form>;
}

const candidateFields = [['phone', 'Phone'], ['city', 'City'], ['current_studies', 'Current studies'], ['availability', 'Availability'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['portfolio', 'Portfolio']];
const companyFields = [['company_name', 'Company name'], ['phone', 'Phone'], ['city', 'City'], ['address', 'Address'], ['website', 'Website'], ['contact_email', 'Contact email']];

function Dashboard({ role }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState('Loading…');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const candidate = role === 'candidate';
  const fields = candidate ? candidateFields : companyFields;
  useEffect(() => {
    api.me(role).then(result => {
      setData(result);
      const next = { name: result.user.name };
      for (const [name] of fields) next[name] = name === 'company_name' ? result.profile.name : result.profile[name] ?? '';
      next[candidate ? 'summary' : 'description'] = result.profile[candidate ? 'summary' : 'description'] ?? '';
      setDraft(next); setMessage('');
    }).catch(error => {
      if (error.status === 401) window.location.replace(`/${role}/login`);
      else setMessage(error.message);
    });
  }, [role]);
  const change = name => value => setDraft(old => ({ ...old, [name]: value }));
  async function run(action, success) {
    setBusy(true); setMessage('');
    try { const result = await action(); if (result?.profile) setData(result); setMessage(success); return result; }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault();
    await run(() => api.save(role, draft), 'Profile saved.');
  }
  async function logout() {
    await run(async () => { await api.logout(); window.location.assign(`/${role}/login`); }, 'Logged out.');
  }
  async function extract() {
    const result = await run(api.extract, 'Suggestions are ready. Review them before applying.');
    if (result) setSuggestions(result.suggestions);
  }
  function applySuggestions() {
    setDraft(old => {
      const next = { ...old };
      for (const key of ['name', 'phone', 'linkedin', 'github']) if (!next[key] && suggestions[key]) next[key] = suggestions[key];
      return next;
    });
    setMessage('Suggestions added to the form. Check them and save your profile.');
  }
  return <>
    <h1>{candidate ? 'Candidate' : 'Company'} dashboard</h1>
    <Notice>{message}</Notice>
    {data && <>
      <p>Signed in as {data.user.name} ({data.user.email}). Email verified.</p>
      {!candidate && <p>Company profile status: {data.profile.status}. Email verification does not replace company approval.</p>}
      <button type="button" disabled={busy} onClick={logout}>Log out</button>
      <h2>Profile</h2>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>{candidate ? 'Your details' : 'Company details'}</legend>
          <Field label={candidate ? 'Full name' : 'Contact name'} name="name" value={draft.name} onChange={change('name')} required maxLength={150} />
          {fields.map(([name, label]) => <Field key={name} label={label} name={name} value={draft[name]} onChange={change(name)} required={name === 'company_name'} type={name === 'contact_email' ? 'email' : ['website', 'linkedin', 'github', 'portfolio'].includes(name) ? 'url' : 'text'} />)}
          <p><label>{candidate ? 'About you' : 'Company description'}<br /><textarea name={candidate ? 'summary' : 'description'} rows={5} cols={50} maxLength={10000} value={draft[candidate ? 'summary' : 'description'] ?? ''} onChange={event => change(candidate ? 'summary' : 'description')(event.target.value)} /></label></p>
          <button type="submit">Save profile</button>
        </fieldset>
      </form>
      <h2>{candidate ? 'Profile photo' : 'Company logo'}</h2>
      {data.photo_url && <p><img src={`${data.photo_url}?v=${Date.now()}`} alt={candidate ? 'Your profile' : 'Company logo'} width="120" /></p>}
      <UploadForm title={candidate ? 'Photo' : 'Logo'} kind="photo" role={role} disabled={busy} onError={setMessage} onResult={result => { setData(result); setMessage('Photo uploaded.'); }} />
      {data.photo_url && <p><button disabled={busy} onClick={() => run(() => api.remove(role, 'photo'), 'Photo removed.')}>Remove photo</button></p>}
      {candidate && <>
        <h2>CV</h2>
        {data.cv_url && <p><a href={data.cv_url}>Download CV</a> — {data.profile.cv_original_name}</p>}
        <UploadForm title="CV document" kind="cv" role={role} disabled={busy} onError={setMessage} onResult={result => { setData(result); setSuggestions(null); setMessage('CV uploaded.'); }} />
        {data.cv_url && <p><button disabled={busy} onClick={extract}>Read CV suggestions</button>{' '}<button disabled={busy} onClick={() => run(() => api.remove(role, 'cv'), 'CV removed.')}>Remove CV</button></p>}
        {suggestions && <section>
          <h3>CV suggestions</h3>
          {Object.keys(suggestions).length ? <dl>{Object.entries(suggestions).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd>{value}</dd></React.Fragment>)}</dl> : <p>No supported fields were found.</p>}
          <p>These are suggestions, not verified details. Applying them fills empty form fields only. Your account email stays unchanged.</p>
          <button type="button" onClick={applySuggestions}>Apply suggestions to empty fields</button>
        </section>}
      </>}
    </>}
  </>;
}

function Home() {
  return <><h1>Feina</h1><p>A job board for candidates and companies.</p>
    <section><h2>Candidates</h2><p>Create a profile and upload your CV.</p><p><a href="/candidate/register">Register as a candidate</a>{' · '}<a href="/candidate/login">Candidate login</a></p></section>
    <section><h2>Companies</h2><p>Create a company profile.</p><p><a href="/company/register">Register a company</a>{' · '}<a href="/company/login">Company login</a></p></section>
  </>;
}

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const match = path.match(/^\/(candidate|company)\/(register|login|dashboard)$/);
  let page;
  if (path === '/') page = <Home />;
  else if (path === '/verify-email') page = <VerifyPage />;
  else if (match) page = match[2] === 'dashboard' ? <Dashboard role={match[1]} /> : <AccountPage role={match[1]} register={match[2] === 'register'} />;
  else page = <><h1>Page not found</h1><a href="/">Return home</a></>;
  return <><header><nav><a href="/">Feina</a>{' | '}<a href="/candidate/login">Candidates</a>{' | '}<a href="/company/login">Companies</a></nav><hr /></header><main>{page}</main></>;
}

createRoot(document.getElementById('root')).render(<App />);
