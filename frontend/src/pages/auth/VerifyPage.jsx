import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';

export default function VerifyPage() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  const [message, setMessage] = useState('Verifying your email…');
  const [role, setRole] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    window.history.replaceState(null, '', '/verify-email');
    if (!token) { setMessage('Invalid verification link.'); setFailed(true); return; }
    api.verify(token).then(result => { setMessage(result.message); setRole(result.role); }).catch(error => { setMessage(error.message); setFailed(true); });
  }, [token]);
  return <><h1>Email verification</h1><Notice>{message}</Notice>{role && <p><a href={`/${role}/login`}>Log in</a></p>}{failed && <p><a href="/candidate/verification">Candidate verification</a>{' · '}<a href="/company/verification">Company verification</a></p>}</>;
}
