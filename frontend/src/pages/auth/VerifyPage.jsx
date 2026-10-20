import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';

export default function VerifyPage() {
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
