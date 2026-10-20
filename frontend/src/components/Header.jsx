import React from 'react';
import { useState } from 'react';
import { api } from '../api';
import { useAccount } from '../context/AccountContext';
import Notice from './Notice';

export default function Header() {
  const { account } = useAccount();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try { await api.logout(); window.location.assign(`/${account.user.role}/login`); }
    catch (error) { setMessage(error.message); setBusy(false); }
  }
  const role = account?.user.role;
  const profilePath = account && `/${role}/${account.user.onboarding_completed_at ? 'profile' : 'setup'}`;
  return <header>
    <nav aria-label="Main navigation">
      <a href="/">Feisea</a>
      {account ? <>
        <a href={`/${role}/dashboard`}>Dashboard</a>
        <a href={profilePath} aria-label="Open profile">
          {account.photo_url ? <img src={`${account.photo_url}?v=${account.photoVersion}`} width="32" height="32" alt="Profile photo" /> : 'Profile'}
        </a>
        <button type="button" aria-label="Log out" title="Log out" disabled={busy} onClick={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 3H3v18h6M10 12h11m-5-5 5 5-5 5" /></svg>
        </button>
      </> : <><a href="/candidate/login">Candidates</a><a href="/company/login">Companies</a></>}
    </nav>
    <Notice>{message}</Notice>
  </header>;
}
