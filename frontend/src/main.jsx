import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';

function ask(label, value = '') {
  const answer = window.prompt(label, value);
  if (answer === null) throw new Error('Cancelled.');
  return answer;
}

function userDetails(current = {}) {
  const user = {
    name: ask('Name', current.name),
    email: ask('Email', current.email),
    role: ask('Role: candidate, company, admin', current.role ?? 'candidate'),
    status: ask('Status: pending, active, blocked', current.status ?? 'active'),
    preferred_locale: ask('Language: ca, es, en', current.preferred_locale ?? 'ca'),
  };
  const password = ask(current.id ? 'New password (leave empty to keep it)' : 'Password (8+ characters, max 72 bytes)');
  if (!current.id || password !== '') user.password = password;
  return user;
}

function App() {
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setBusy(true);
    try {
      const value = await action();
      setResult(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    } catch (error) {
      setResult(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function edit() {
    const user = await api.get(ask('User ID'));
    return api.update(user.id, userDetails(user));
  }

  async function remove() {
    const id = ask('User ID');
    if (!window.confirm(`Delete user ${id}?`)) return 'Cancelled.';
    await api.delete(id);
    return `User ${id} deleted.`;
  }

  return (
    <main>
      <button disabled={busy} onClick={() => run(api.health)}>Check API</button>{' '}
      <button disabled={busy} onClick={() => run(() => api.list(ask('Page', '1')))}>List users</button>{' '}
      <button disabled={busy} onClick={() => run(() => api.get(ask('User ID')))}>Get user</button>{' '}
      <button disabled={busy} onClick={() => run(() => api.create(userDetails()))}>Create user</button>{' '}
      <button disabled={busy} onClick={() => run(edit)}>Edit user</button>{' '}
      <button disabled={busy} onClick={() => run(remove)}>Delete user</button>
      <pre role="status" aria-live="polite">{busy ? 'Loading…' : result}</pre>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
